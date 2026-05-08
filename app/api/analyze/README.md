# /api/analyze

Endpoint para analizar mensajes del usuario y detectar intención + extraer contexto.

## Request

**Method:** POST
**Content-Type:** application/json

**Body:**
```json
{
  "message": "string (required, 1-1000 chars)",
  "userId": "string (optional, for rate limiting)"
}
```

## Response

**Success (200):**
```json
{
  "intent": "travel | development | fitness | learning | generic",
  "confidence": 0.95,
  "reasoning": "Usuario menciona destino y duración específica",
  "context": {
    "destination": "Japón",
    "duration": 7,
    "budget": 2000
  },
  "metadata": {
    "processingTimeMs": 1234,
    "timestamp": "2024-05-08T10:30:00.000Z"
  }
}
```

**Error (400 - Bad Request):**
```json
{
  "error": "Invalid request",
  "details": []
}
```

**Error (429 - Rate Limit):**
```json
{
  "error": "Rate limit exceeded. Please try again in a minute."
}
```

**Error (500 - Internal Error):**
```json
{
  "error": "Internal server error",
  "message": "..."
}
```

## Examples

### Travel
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero ir a París 5 días"}'
```

### Development
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Aprender Python para data science"}'
```

### Fitness
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Rutina para ganar músculo"}'
```

## Rate Limiting

- **Limit:** 30 requests per minute per userId
- **Window:** Rolling 60 seconds
- **Default userId:** "anonymous"

## Implementation

Located in `app/api/analyze/route.ts`

Uses:
- `lib/intent-detection.ts` — Intent classification
- `lib/context-extraction.ts` — Parameter extraction
- `lib/schemas.ts` — Zod validation
- `lib/groq.ts` — AI completions + simple in-memory rate limiter
