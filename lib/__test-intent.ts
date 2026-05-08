import { detectIntent } from "./intent-detection";
import { extractContext } from "./context-extraction";

const testCases = [
  "Quiero viajar a Japón por una semana con $2000",
  "Cómo aprendo React en 3 meses, ya sé HTML y CSS",
  "Necesito bajar 10kg en 2 meses, soy principiante",
  "Quiero aprender francés en 6 meses",
];

async function test() {
  console.log("🧪 Testing Intent Detection + Context Extraction\n");

  for (const input of testCases) {
    console.log(`\n📝 Input: "${input}"`);
    console.log("─".repeat(60));

    // Detectar intent
    const { intent, confidence } = await detectIntent(input);
    console.log(`Intent: ${intent} (${(confidence * 100).toFixed(0)}%)`);

    // Extraer contexto
    const context = await extractContext(intent, input);
    console.log("Context:", JSON.stringify(context, null, 2));
  }

  console.log("\n✅ All tests completed!");
}

test().catch(console.error);
