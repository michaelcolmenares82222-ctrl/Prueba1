import { createOpenAI } from "@ai-sdk/openai";
import {
  GroqAdapter,
  getSdkClientOptions,
  type CopilotServiceAdapter,
} from "@copilotkit/runtime";
import type { Groq } from "groq-sdk";

export type GroqChatServiceAdapterParams = {
  groq: Groq;
  model?: string;
  disableParallelToolCalls?: boolean;
};

/**
 * `groq-sdk` defaults `baseURL` to `https://api.groq.com` and adds `/openai/v1/...` per request.
 * `@ai-sdk/openai` appends paths like `/chat/completions` to `baseURL` as-is, so we must point at
 * the OpenAI-compatible prefix or requests hit `https://api.groq.com/chat/completions` (404).
 */
function groqOpenAiCompatibleBaseURL(raw: string | undefined): string {
  const trimmed = (raw ?? "https://api.groq.com").replace(/\/+$/, "");
  return trimmed.includes("/openai/v1") ? trimmed : `${trimmed}/openai/v1`;
}

/**
 * Groq returns a `failed_generation` field inside the JSON body of 4xx errors when the
 * model produces tool args / JSON that fail server-side validation. `@ai-sdk/openai`
 * surfaces only `error.message` to upstream code, so without this wrapper we lose the
 * actual model output and cannot iterate. We tag the line with `[GROQ_TOOL_FAILURE]`
 * so it is greppable in production logs.
 */
function withFailedGenerationLogging(
  fetchImpl?: typeof fetch
): typeof fetch {
  const baseFetch: typeof fetch = fetchImpl ?? fetch;
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (!response.ok && response.status >= 400 && response.status < 500) {
      try {
        const cloned = response.clone();
        const contentType = cloned.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const body = (await cloned.json()) as {
            error?: {
              code?: string;
              message?: string;
              failed_generation?: unknown;
            };
          };
          const err = body?.error;
          if (err?.failed_generation !== undefined) {
            console.error(
              "[GROQ_TOOL_FAILURE]",
              JSON.stringify(
                {
                  status: response.status,
                  code: err.code,
                  message: err.message,
                  failed_generation: err.failed_generation,
                },
                null,
                2
              )
            );
          }
        }
      } catch {
        // Logging is best-effort; never break the upstream caller.
      }
    }
    return response;
  };
}

/**
 * Wraps {@link GroqAdapter} so {@link CopilotServiceAdapter.getLanguageModel} uses the
 * Chat Completions API (`/v1/chat/completions`) instead of the OpenAI Responses API
 * (`/v1/responses`). Groq rejects `POST /responses`; CopilotKit's default agent uses
 * `getLanguageModel()` from the service adapter.
 */
export function createGroqChatServiceAdapter(
  params: GroqChatServiceAdapterParams
): CopilotServiceAdapter {
  const inner = new GroqAdapter(params);
  return {
    get name() {
      return inner.name;
    },
    get provider() {
      return inner.provider;
    },
    get model() {
      return inner.model;
    },
    process: (request) => inner.process(request),
    getLanguageModel() {
      const groq = inner.groq;
      const options = getSdkClientOptions(groq);
      return createOpenAI({
        baseURL: groqOpenAiCompatibleBaseURL(groq.baseURL),
        apiKey: groq.apiKey,
        headers: options.defaultHeaders,
        fetch: withFailedGenerationLogging(options.fetch),
        name: "groq",
      }).chat(inner.model);
    },
  };
}
