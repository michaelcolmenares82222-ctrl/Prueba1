import {
  generateTravelUI,
  generateDevUI,
  generateFitnessUI,
} from "./ui-generators";
import {
  TravelContext,
  DevContext,
  FitnessContext,
} from "./types";

async function test() {
  console.log("🧪 Testing UI Generators\n");

  // Test 1: Travel
  console.log("1️⃣  Testing Travel UI Generator");
  const travelContext: TravelContext = {
    destination: "Tokio",
    duration: 5,
    budget: 2000,
    currency: "USD",
    interests: ["tecnología", "gastronomía"],
    travelers: 2,
    travelStyle: "standard",
    flexibility: "flexible",
  };

  const travelUI = await generateTravelUI(travelContext);
  console.log("✅ Travel UI generated");
  console.log("Type:", travelUI.type);
  console.log("Content length:", travelUI.content.length, "chars");
  console.log(
    "Preview:",
    travelUI.content.substring(0, 200) + "...\n"
  );

  // Test 2: Development
  console.log("2️⃣  Testing Dev UI Generator");
  const devContext: DevContext = {
    projectType: "web app",
    timeframe: "3 meses",
    timeframeWeeks: 12,
    currentSkills: ["HTML", "CSS"],
    targetStack: ["React", "Node.js"],
    learningGoal: "Crear una app full-stack",
    experience: "beginner",
    studyTimePerWeek: 15,
  };

  const devUI = await generateDevUI(devContext);
  console.log("✅ Dev UI generated");
  console.log("Type:", devUI.type);
  console.log("Content length:", devUI.content.length, "chars");
  console.log(
    "Preview:",
    devUI.content.substring(0, 200) + "...\n"
  );

  // Test 3: Fitness
  console.log("3️⃣  Testing Fitness UI Generator");
  const fitnessContext: FitnessContext = {
    goal: "muscle_gain",
    timeframe: 12,
    currentLevel: "intermediate",
    restrictions: [],
    equipment: "full_gym",
    daysPerWeek: 5,
    dietaryPreferences: ["alto proteína"],
  };

  const fitnessUI = await generateFitnessUI(fitnessContext);
  console.log("✅ Fitness UI generated");
  console.log("Type:", fitnessUI.type);
  console.log("Content length:", fitnessUI.content.length, "chars");
  console.log(
    "Preview:",
    fitnessUI.content.substring(0, 200) + "...\n"
  );

  console.log("✅ All UI generators working!");
}

test().catch(console.error);
