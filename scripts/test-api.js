const API_URL = "http://localhost:3000/api/analyze";

const testCases = [
  {
    name: "Travel Intent",
    data: {
      message: "Quiero viajar a Japón por una semana con $2000",
      userId: "test-user-1",
    },
  },
  {
    name: "Development Intent",
    data: {
      message: "Cómo aprendo React en 3 meses, ya sé HTML y CSS",
      userId: "test-user-2",
    },
  },
  {
    name: "Fitness Intent",
    data: {
      message: "Necesito bajar 10kg en 2 meses, soy principiante",
      userId: "test-user-3",
    },
  },
  {
    name: "Invalid Request",
    data: {
      message: "",
      userId: "test-user-4",
    },
  },
];

async function runTests() {
  console.log("🧪 Testing /api/analyze endpoint\n");

  for (const { name, data } of testCases) {
    console.log(`\n📝 ${name}`);
    console.log("─".repeat(60));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Status:", response.status);
      console.log("Response:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }

  // Test GET
  console.log(`\n📝 GET Endpoint Info`);
  console.log("─".repeat(60));
  const infoResponse = await fetch(API_URL);
  const info = await infoResponse.json();
  console.log(JSON.stringify(info, null, 2));

  console.log("\n✅ All tests completed!");
}

runTests().catch(console.error);
