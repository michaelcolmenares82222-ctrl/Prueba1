# /api/copilotkit

CopilotKit runtime endpoint que conecta el frontend con Groq para generación de UIs dinámicas.

## Purpose

Este endpoint actúa como el bridge entre:

- **Frontend:** CopilotKit React components
- **Backend:** Groq LLM (Llama 3.3 70B)

## Configuration

**Adapter:** GroqAdapter  
**Model:** llama-3.3-70b-versatile  
**Endpoint:** /api/copilotkit

## Usage

Este endpoint es consumido automáticamente por el CopilotKit provider en el frontend.

```tsx
import { CopilotKit } from "@copilotkit/react-core";

<CopilotKit runtimeUrl="/api/copilotkit">
  {/* Your app */}
</CopilotKit>
```

## Available Actions

Actions definidas en `lib/copilot-actions.ts` y registradas en `app/api/copilotkit/route.ts`:

1. **generate_travel_plan**
   - Genera itinerarios de viaje
   - Input: TravelContext
   - Output: Plan completo con días, presupuesto, recomendaciones

2. **generate_dev_roadmap**
   - Genera roadmaps de aprendizaje
   - Input: DevContext
   - Output: Timeline, tech stack, recursos

3. **generate_fitness_plan**
   - Genera planes de entrenamiento
   - Input: FitnessContext
   - Output: Rutinas, nutrición, progresión

## Environment Variables

Required:

- `GROQ_API_KEY` — API key de Groq

## Testing

```bash
# Ver info del endpoint
curl http://localhost:3000/api/copilotkit

# Testing completo requiere frontend CopilotKit
npm run dev
# Luego interactuar con el chat UI
```

## Implementation Notes

- El runtime maneja streaming automáticamente
- Las respuestas son progresivas (chunks)
- Rate limiting: usa el mismo cliente Groq; para límites por usuario considera `/api/analyze` o middleware propio
- Errores se propagan al frontend via CopilotKit
