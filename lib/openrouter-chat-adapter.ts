import { OpenAIAdapter, type OpenAIAdapterParams } from "@copilotkit/runtime";
import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

export interface OpenAIChatCompletionsAdapterParams
  extends Omit<OpenAIAdapterParams, "openai"> {
  apiKey: string;
  baseURL: string;
  headers?: Record<string, string>;
  model: string;
}

/**
 * Adapter de CopilotKit para proveedores OpenAI-compatibles que SOLO
 * exponen el endpoint clásico `/v1/chat/completions` (OpenRouter, DeepSeek,
 * Together, Fireworks, etc.).
 *
 * ## Por qué existe
 * `OpenAIAdapter.getLanguageModel()` construye internamente un modelo
 * con `createOpenAI({...})(modelId)`. En `@ai-sdk/openai` v3 ese factory
 * por defecto apunta al **Responses API** (`/v1/responses`), introducido
 * por OpenAI en marzo 2025. OpenRouter (y casi cualquier otro proveedor
 * OpenAI-compatible) no lo soporta y devuelve `400 invalid_prompt`.
 *
 * `CopilotRuntime` invoca `getLanguageModel()` cuando no se le pasa una
 * lista de `agents` explícita: crea un `BuiltInAgent` por defecto con ese
 * `LanguageModel`. Por eso forzamos `provider.chat(modelId)`, que sí usa
 * `/v1/chat/completions`.
 *
 * El método `process()` heredado de `OpenAIAdapter` ya usa
 * `openai.chat.completions.stream(...)`, así que en ese path no hace falta
 * cambiar nada.
 */
export class OpenAIChatCompletionsAdapter extends OpenAIAdapter {
  private readonly _apiKey: string;
  private readonly _baseURL: string;
  private readonly _headers?: Record<string, string>;
  private readonly _modelId: string;

  constructor(params: OpenAIChatCompletionsAdapterParams) {
    const openai = new OpenAI({
      apiKey: params.apiKey,
      baseURL: params.baseURL,
      defaultHeaders: params.headers,
    });
    super({ ...params, openai });
    this._apiKey = params.apiKey;
    this._baseURL = params.baseURL;
    this._headers = params.headers;
    this._modelId = params.model;
  }

  // El tipo de retorno de la base depende de qué versión de `ai` resuelva
  // CopilotKit, así que lo dejamos inferido por TS para evitar conflictos
  // entre `LanguageModelV1` (top-level ai v3) y `LanguageModelV3` (nested
  // ai v6). Funcionalmente, `provider.chat(...)` devuelve un modelo
  // compatible que apunta a /v1/chat/completions.
  override getLanguageModel() {
    const provider = createOpenAI({
      baseURL: this._baseURL,
      apiKey: this._apiKey,
      headers: this._headers,
    });
    return provider.chat(this._modelId) as ReturnType<
      OpenAIAdapter["getLanguageModel"]
    >;
  }
}
