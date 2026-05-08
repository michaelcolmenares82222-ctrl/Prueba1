# Intent Classification Prompt

Analiza el siguiente mensaje del usuario y determina su intención principal.

## Categorías posibles

- **travel**: Planificación de viajes, destinos, itinerarios
- **development**: Aprendizaje de programación, roadmaps técnicos, proyectos de código
- **fitness**: Ejercicio, nutrición, pérdida/ganancia de peso, rutinas
- **learning**: Aprendizaje de temas no técnicos, estudios, educación
- **generic**: Consultas generales que no encajan en las categorías anteriores

## Ejemplos

### Travel
- "Quiero ir a Japón por una semana"
- "Planea un viaje a Europa con $3000"
- "Destinos económicos en Asia"

### Development
- "Cómo aprender React en 3 meses"
- "Quiero hacer una app móvil"
- "Roadmap para ser backend developer"

### Fitness
- "Necesito bajar 10kg en 2 meses"
- "Rutina para ganar músculo"
- "Plan de alimentación saludable"

### Learning
- "Cómo aprender francés rápido"
- "Estudiar para el examen de biología"
- "Mejorar mi inglés conversacional"

### Generic
- "Qué es la fotosíntesis"
- "Recomiéndame una película"
- "Explica la teoría de la relatividad"

## Input del usuario

{USER_INPUT}

## Instrucciones de respuesta

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto adicional):

```json
{
  "intent": "travel" | "development" | "fitness" | "learning" | "generic",
  "confidence": 0.0 a 1.0,
  "reasoning": "breve explicación de por qué elegiste esta categoría"
}
```

Si el mensaje es ambiguo o podría ser múltiples categorías, elige la más probable y reduce el confidence.
