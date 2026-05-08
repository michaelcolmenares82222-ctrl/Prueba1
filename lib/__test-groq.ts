import {
  testGroqConnection,
  groqCompletion,
  groqJsonCompletion,
} from "./groq";

async function test() {
  console.log("🧪 Testing Groq client...\n");

  // Test 1: Conexión
  console.log("1. Testing connection...");
  const isConnected = await testGroqConnection();
  console.log(isConnected ? "✅ Connected" : "❌ Failed");

  // Test 2: Completion simple
  console.log("\n2. Testing simple completion...");
  const response = await groqCompletion("Di hola en español");
  console.log("Response:", response);

  // Test 3: JSON completion
  console.log("\n3. Testing JSON completion...");
  const jsonResponse = await groqJsonCompletion<{ greeting: string }>(
    "Devuelve un JSON con una key 'greeting' que diga hola en español"
  );
  console.log("JSON Response:", jsonResponse);

  console.log("\n✅ All tests passed!");
}

test().catch(console.error);
