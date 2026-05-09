# Context Extraction Prompts

## Reglas generales (aplican a TODOS los intents)

1. Extrae **solo** información que el usuario haya mencionado explícitamente.
2. **No inventes** ni asumas datos: si el usuario no dijo presupuesto, no lo pongas.
3. Si un campo es opcional y no fue mencionado, **omítelo** del JSON (no uses null ni "").
4. Mapea sinónimos comunes en español:
   - `bajar peso` / `adelgazar` / `perder grasa` → `goal: "weight_loss"`
   - `ganar músculo` / `hipertrofia` / `volumen` → `goal: "muscle_gain"`
   - `tonificar` / `definir` → `goal: "general"`
   - `resistencia` / `cardio` / `correr` → `goal: "endurance"`
   - `mochilero` / `barato` → `travelStyle: "budget"`
   - `de lujo` / `5 estrellas` → `travelStyle: "luxury"`
   - `principiante` / `novato` → `experience` o `currentLevel: "beginner"`
   - `intermedio` → `"intermediate"`; `avanzado` / `experto` → `"advanced"`
5. **Mensajes muy cortos o respuestas sueltas** (siguen una conversación):
   - Si el bloque incluye `=== Datos ya recopilados ===`, fusiona esos datos con lo nuevo.
   - Ejemplos de extracción incremental:
     - `"5 días con $1500"` → `duration: 5`, `budget: 1500`
     - `"Solo"` / `"viajo solo"` → `travelers: 1`
     - `"Somos 4"` → `travelers: 4`
     - `"Cultura y gastronomía"` → `interests: ["cultura", "gastronomía"]`
     - `"80 kg"` / `"peso 80"` → `currentWeight: 80` (fitness)
     - `"1,75 m"` / `"175 cm"` / `"mido 1.75"` → `height: 175` (fitness, siempre cm)
6. Convierte unidades cuando el usuario las expresa en texto:
   - Días: "una semana" → 7, "dos semanas" → 14, "1 mes" → 30.
   - Semanas en timeframe de fitness: "3 meses" → 12, "6 meses" → 24.
   - Dinero: "$1500" / "1500 USD" / "1500 dólares" → 1500.
7. Responde SIEMPRE con un único objeto JSON válido, sin texto adicional.

---

## Travel Context Extraction

El usuario quiere planear un viaje. Extrae todos los parámetros posibles.

**Input:** {USER_INPUT}

**Parámetros a extraer:**
- destination (string, requerido)
- duration (number en días, requerido)
- budget (number, opcional)
- currency (string, default: "USD")
- interests (array de strings: cultura, naturaleza, gastronomía, aventura, relax, etc.)
- travelers (number, default: 1)
- travelStyle ("budget" | "standard" | "luxury", inferir del presupuesto/lenguaje)
- departureDate (string ISO, opcional)
- flexibility ("fixed" | "flexible", default: "flexible")

**Responde JSON:**
```json
{
  "destination": "Japón",
  "duration": 7,
  "budget": 2000,
  "currency": "USD",
  "interests": ["cultura", "gastronomía"],
  "travelers": 1,
  "travelStyle": "standard",
  "flexibility": "flexible"
}
```

---

## Development Context Extraction

El usuario quiere aprender a programar o hacer un proyecto.

**Input:** {USER_INPUT}

**Parámetros a extraer:**
- projectType (string: "web_app", "mobile_app", "api", "data_science", etc.)
- timeframe (string: "1 mes", "3 meses", "6 meses", etc.)
- timeframeWeeks (number, convertir timeframe a semanas)
- currentSkills (array de strings: HTML, CSS, JavaScript, Python, etc.)
- targetStack (array de strings: tecnologías a aprender)
- learningGoal (string: descripción del objetivo)
- experience ("beginner" | "intermediate" | "advanced")
- studyTimePerWeek (number en horas, default: 10)

**Responde JSON:**
```json
{
  "projectType": "mobile_app",
  "timeframe": "3 meses",
  "timeframeWeeks": 12,
  "currentSkills": ["HTML", "CSS", "JavaScript"],
  "targetStack": ["React Native", "Node.js", "MongoDB"],
  "learningGoal": "Crear una app móvil de red social",
  "experience": "intermediate",
  "studyTimePerWeek": 15
}
```

---

## Fitness Context Extraction

El usuario quiere mejorar su condición física.

**Input:** {USER_INPUT}

**Parámetros a extraer:**
- goal ("weight_loss" | "muscle_gain" | "endurance" | "general" | "flexibility")
- timeframe (number en semanas)
- currentLevel ("beginner" | "intermediate" | "advanced")
- restrictions (array: lesiones, alergias, limitaciones)
- equipment ("none" | "basic" | "full_gym")
- daysPerWeek (number, default: 4)
- dietaryPreferences (array: vegetariano, vegano, sin gluten, etc.)

**Responde JSON:**
```json
{
  "goal": "weight_loss",
  "timeframe": 8,
  "currentLevel": "beginner",
  "restrictions": [],
  "equipment": "basic",
  "daysPerWeek": 4,
  "dietaryPreferences": []
}
```

---

## Learning Context Extraction

El usuario quiere aprender un tema no técnico.

**Input:** {USER_INPUT}

**Parámetros a extraer:**
- subject (string: el tema principal)
- timeframe (string)
- currentLevel (string: "principiante", "intermedio", "avanzado")
- learningStyle ("visual" | "reading" | "practical" | "mixed")
- goal (string: qué quiere lograr)
- studyTimePerDay (number en horas, opcional)

**Responde JSON:**
```json
{
  "subject": "francés",
  "timeframe": "6 meses",
  "currentLevel": "principiante",
  "learningStyle": "mixed",
  "goal": "mantener conversaciones básicas",
  "studyTimePerDay": 1
}
```

---

## Generic Context Extraction

Para consultas generales.

**Input:** {USER_INPUT}

**Responde JSON:**
```json
{
  "query": "el mensaje original",
  "category": "categoría general inferida",
  "additionalInfo": {}
}
```
