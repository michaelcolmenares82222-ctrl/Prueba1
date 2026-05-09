# Universal AI Assistant

> Asistente de UI generativa que crea apps, planes y dashboards en vivo con
> datos reales — no chatbot de texto: una interfaz interactiva por respuesta.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![OpenRouter](https://img.shields.io/badge/LLM-OpenRouter-7c3aed)

---

## ¿Qué hace?

- **Genera UIs completas, no texto.** Pídele un viaje, un roadmap o un plan
  fitness y obtienes una interfaz interactiva renderizada al vuelo (Itinerario,
  Timeline, ChartNutricional, etc.).
- **Conecta el LLM con datos reales** vía 4 herramientas MCP gratuitas
  (Open-Meteo, Nominatim/Overpass, Frankfurter, Wikipedia) llamadas en
  paralelo con tolerancia a fallos.
- **Construye mini-apps en vivo** con un App Builder estilo Lovable que
  compila código React en el navegador con Sandpack y cae a templates
  validados si el LLM falla.

---

## Qué más hemos hecho (resumen del trabajo adicional)

Además del flujo original de intención → contexto → JSON de UI, el repo
incorpora estas piezas, todas pensadas para **Generative UI** con datos
reales y rutas navegables:

1. **Navegación global** — `TopNav` en el layout enlaza el asistente (`/`),
   la **UI morfológica** (`/morphic`), el **App Builder** (`/app-builder`) y
   la **demo** (`/demo`), resaltando la ruta activa para que no sea un
   “monolito” de una sola pantalla.

2. **Capa MCP propia** — Integración con **Open-Meteo**, **Nominatim +
   Overpass**, **Frankfurter** y **Wikipedia** bajo `lib/mcp/*`, expuesta por
   `app/api/mcp/[tool]/route.ts`. Los viajes pueden enriquecerse en paralelo
   (`Promise.allSettled`): si un servicio falla, el resto sigue.

3. **Bloque “Datos en tiempo real” en viajes** — Cuando el plan trae
   `realData`, `TravelPlanUI` monta `RealTimeData` (clima, lugares destacados,
   resumen wiki) con presentación clara y sin romper la UI si falta algún
   campo.

4. **Showcase morfológico** — `detectUIContext` + registro de widgets
   (`lib/ui-context-detector.ts`, `lib/ui-component-registry.ts`) y
   `MorphicRenderer` con carga diferida, skeletons y animaciones para
   mapas, timelines, clima, fitness, etc.

5. **App Builder** — Editor + preview con **Sandpack**, generación vía
   `app/api/build-app` y plantillas probadas (`todo`, `calculator`,
   `pomodoro`) para que el preview **siempre** tenga un camino válido aunque
   el modelo alucine.

6. **Landing `/demo`** — Página de presentación con animaciones y datos de
   ejemplo (p. ej. clima) enlazada desde el resto del sitio.

7. **Rendimiento y depuración** — Paralelización de MCP, caché en memoria con
   TTL en la ruta de generación, y `lib/perf-log.ts` para marcas de tiempo en
   servidor (silenciable con `PERF_LOG=0`).

8. **Pruebas contra red real** — `lib/__tests__/mcp.test.ts` (ejecutable con
   `tsx` o el script `lib/__tests__/run.ps1`) valida los conectores MCP
   frente a las APIs públicas.

9. **Proveedor LLM unificado** — Flujo principal con **OpenRouter** (modelos
   free tier) y **Groq** como respaldo; variables documentadas en
   `.env.example` y en la tabla de abajo.

---

## Demos (local)

| Ruta              | Qué hace                                                     |
| ----------------- | ------------------------------------------------------------ |
| `/`               | Asistente CopilotKit con sidebar de chat                     |
| `/demo`           | Landing/showcase animado con clima en vivo y mood-switcher   |
| `/morphic`        | Showcase de UI morfológica + datos enriquecidos vía MCP      |
| `/app-builder`    | Generador de mini-apps con vista previa Sandpack             |

```
┌─────────────────────────────────────────────────────────────┐
│  ✦  Universal AI Assistant                                  │
│  ─────────────────────────                                  │
│  > Plan a 5-day trip to Tokyo                               │
│                                                             │
│  ╭──────────────╮ ╭──────────────╮ ╭──────────────╮         │
│  │  🌤  Clima   │ │  📍 Lugares │ │  💱 Divisas  │         │
│  │  21° / 12°  │ │   12 POIs   │ │   1 USD =    │         │
│  │  Despejado  │ │  Senso-ji…  │ │   148 JPY    │         │
│  ╰──────────────╯ ╰──────────────╯ ╰──────────────╯         │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura

```mermaid
flowchart LR
    U[Usuario<br/>Chat o formulario] --> I[/api/analyze<br/>Intent + Zod/]
    I --> C[Contexto tipado<br/>destino, días, stack…]
    C --> P{Fan-out paralelo}
    P --> M1[MCP weather]
    P --> M2[MCP places]
    P --> M3[MCP exchange]
    P --> M4[MCP wikipedia]
    P --> L[LLM<br/>generate-ui]
    M1 & M2 & M3 & M4 & L --> S[UI Spec validada con Zod]
    S --> D[detectUIContext<br/>domain · mood · widgets]
    D --> R[MorphicRenderer<br/>+ Templates]
    R --> V[UI interactiva]
```

Cada flecha es un boundary tipado: el LLM nunca puede romper la UI porque
todo se valida con Zod antes de cruzar la frontera.

---

## Funcionalidades

### 1. Asistente CopilotKit con 3 flujos

`travel`, `fitness`, `dev`. La conversación es manejada por
`@copilotkit/react-core` y la generación rica corre tras `/api/generate-ui`.

- Detección de intención + extracción de slots con Zod
  (`lib/intent-detection.ts`, `lib/context-extraction.ts`).
- Plantillas dedicadas en `app/components/templates/{travel,fitness,dev}`.
- Acciones registradas en `lib/copilot-actions.ts`.

### 2. Capa MCP con 4 APIs gratuitas

Todas detrás de `lib/mcp/*` y expuestas vía `app/api/mcp/[tool]/route.ts`.

- **Weather** — Open-Meteo (geocoding + forecast).
- **Places** — Nominatim (search) + Overpass (POIs cercanos).
- **Exchange** — Frankfurter (tasas de cambio ECB).
- **Wikipedia** — REST API summary con fallback ES → EN.

`enrichTravelContext` agrega los 4 en paralelo con `Promise.allSettled` —
falla un servicio, el resto sigue.

### 3. UI morfológica

`detectUIContext(prompt, domain)` (`lib/ui-context-detector.ts`) elige
dominio, subtipo, mood, densidad, esquema de color y un **set de widgets**
del registro (`lib/ui-component-registry.ts`).

`MorphicRenderer` (`app/components/morphic/MorphicRenderer.tsx`) renderiza
la matriz con lazy loading + skeletons + animación de entrada.

8 widgets disponibles:

| Widget          | Uso típico                                      |
| --------------- | ----------------------------------------------- |
| `RouteMap`      | Viajes de aventura o rutas en coche             |
| `Timeline`      | Itinerario, roadmap o plan semanal              |
| `WeatherCards`  | Pronóstico por día                              |
| `RestaurantMap` | Playa, escapada urbana o estilo premium         |
| `CalorieTracker`| Fitness: déficit o volumen muscular             |
| `StrengthChart` | Fitness: fuerza o hipertrofia                   |
| `ComponentTree` | Roadmap de desarrollo con vista arquitectónica  |
| `GenericCard`   | Comodín cuando no encaja un widget específico   |

### 4. App Builder estilo Lovable

`/app-builder` + `lib/app-builder/code-generator.ts` + `app/api/build-app`.

- Plantillas probadas (`todo`, `calculator`, `pomodoro`) que garantizan que
  la vista previa siempre funciona aunque el LLM devuelva basura.
- Editor + preview con `@codesandbox/sandpack-react`.
- Genera código React + Tailwind y lo monta en milisegundos.

---

## Configuración local

### Requisitos

- Node.js 20+
- Una API key de [OpenRouter](https://openrouter.ai/) (free tier: 20 req/min,
  200 req/día por IP en modelos `:free`).
- Opcional: una API key de [Groq](https://console.groq.com/) como fallback.

### Pasos

```bash
# 1. Clona el repo
git clone <this-repo-url>.git
cd <this-repo-folder>

# 2. Instala dependencias
npm install

# 3. Copia el .env.example y rellena tu key
cp .env.example .env.local
# Edita .env.local y pon tu OPENROUTER_API_KEY (sk-or-...)

# 4. Arranca el dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) o
[http://localhost:3000/demo](http://localhost:3000/demo): la barra superior
y la demo enlazan el asistente, la UI morfológica, el App Builder y la
landing animada.

---

## Variables de entorno

| Variable                      | Requerida | Default                  | Para qué                                                                   |
| ----------------------------- | --------- | ------------------------ | -------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`          | **Sí**    | —                        | Chat + tool routing del CopilotKit runtime y generación rica de JSON.      |
| `OPENROUTER_CHAT_MODEL`       | No        | `z-ai/glm-4.5-air:free`  | Modelo del chat. Otros free-tier estables: `openai/gpt-oss-120b:free`.     |
| `OPENROUTER_GENERATION_MODEL` | No        | igual al de chat         | Modelo para `/api/generate-ui` (JSON estructurado).                        |
| `GROQ_API_KEY`                | No        | —                        | Fallback opcional si OpenRouter no está configurado.                       |
| `GROQ_CHAT_MODEL`             | No        | `llama-3.1-8b-instant`   | Modelo Groq para chat (sólo si usas Groq).                                 |
| `GROQ_GENERATION_MODEL`       | No        | `llama-3.3-70b-versatile`| Modelo Groq para generación (sólo si usas Groq).                           |
| `NEXT_PUBLIC_APP_URL`         | No        | `http://localhost:3000`  | URL pública usada por el cliente (CopilotKit runtime, share links).        |
| `PERF_LOG`                    | No        | activado                 | Pon `0`, `false` u `off` para silenciar los logs `[perf]` del servidor (`lib/perf-log.ts`). |

> Groq es 100 % opcional: si `OPENROUTER_API_KEY` está presente, se usa
> OpenRouter por encima.

---

## Pila tecnológica

| Capa            | Tecnología                                                   |
| --------------- | ------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router, Route Handlers, Server Components)   |
| UI              | React 19 + Tailwind CSS v4 + lucide-react                    |
| Generative UI   | CopilotKit 1.3 (`@copilotkit/react-core` + `runtime`)        |
| Orquestación AI | Vercel AI SDK (`ai`) para streaming y tool calls             |
| LLM provider    | OpenRouter (default `z-ai/glm-4.5-air:free`); fallback Groq  |
| Validación      | Zod en cada boundary LLM ↔ app                              |
| App Builder     | `@codesandbox/sandpack-react` (preview + editor)             |
| Animaciones     | `framer-motion`                                              |
| Fechas          | `date-fns`                                                   |
| Lenguaje        | TypeScript strict                                            |

---

## APIs externas usadas

| API                | Propósito                          | Free tier                              | Docs                                                       |
| ------------------ | ---------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Open-Meteo         | Geocoding + clima actual y forecast | Sin key, sin límite documentado       | https://open-meteo.com/en/docs                             |
| Nominatim (OSM)    | Búsqueda de lugares por nombre     | Sin key, 1 req/s recomendado           | https://nominatim.org/release-docs/latest/api/Overview/    |
| Overpass (OSM)     | POIs cercanos a un punto           | Sin key, fair use                      | https://wiki.openstreetmap.org/wiki/Overpass_API           |
| Frankfurter        | Tasas de cambio ECB                | Sin key, sin límite documentado        | https://www.frankfurter.app/docs/                          |
| Wikipedia REST     | Resúmenes de artículos             | Sin key, fair use con `User-Agent`     | https://en.wikipedia.org/api/rest_v1/                      |
| OpenRouter         | LLM provider unificado             | 20 req/min, 200 req/día (modelos free) | https://openrouter.ai/docs                                 |

---

## Pruebas

Suite standalone (sin Jest/Vitest) que pega contra los MCP en vivo:

```powershell
# desde la raíz del repo
npx tsx --env-file=.env.local lib/__tests__/mcp.test.ts

# atajo PowerShell:
pwsh lib/__tests__/run.ps1
```

El runner imprime una tabla `[OK] / [FAIL] / [SKIP]`. Los `SKIP` son fallos
transitorios de las APIs externas (5xx / timeouts) y **no** rompen el exit
code; sólo `FAIL` devuelve `1`.

---

## Rendimiento

- Generación de UI en frío: ≈70 s la primera vez (intent + context + plan
  enriquecido + LLM). Caché en memoria con TTL de 10 min hace que la misma
  consulta vuelva en ~10 ms.
- Auditoría: tras paralelizar las llamadas a MCP y precomputar el contexto
  de UI, `/api/generate-ui` corre **≈3× más rápido en frío** que la versión
  inicial. La caché evita la mayoría de cold-paths en uso interactivo.

---

## Despliegue (Vercel)

1. Push del repo a GitHub.
2. Importa el proyecto en [vercel.com/new](https://vercel.com/new).
3. Añade `OPENROUTER_API_KEY` (y `NEXT_PUBLIC_APP_URL` con la URL final) en
   las env vars del proyecto.
4. *Deploy*. CopilotKit lee la key en runtime, así que basta con que esté
   presente al desplegar.

> Para más detalle, ver `DEPLOYMENT.md`.

---

## Convenciones para agentes que tocan el repo

Lee `AGENTS.md`. Resumen rápido:

- Nunca importes `groq-sdk` desde un componente cliente — siempre tras un
  route handler.
- Valida con Zod cualquier output del LLM antes de devolverlo al cliente.
- Marca componentes de templates como `"use client"`.
- No edites `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, ni
  archivos en `public/` salvo que sea estrictamente necesario.

---

Hecho para el **Generative UI Hackathon · 2026**.
