"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        labels={{
          title: "Universal AI Assistant",
          initial: "¡Hola! ¿En qué puedo ayudarte hoy?",
        }}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
