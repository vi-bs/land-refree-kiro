import fs from "fs";
import path from "path";

export async function runReferee(constraints) {
  const prompt = fs.readFileSync(
    path.resolve("backend/prompts/kiro_referee_prompt.txt"),
    "utf-8"
  );

  // 🔴 Prototype response (replace with Kiro SDK call later)
  return {
    scenarios: [
      {
        type: "Residential Housing",
        roi: "Medium-High",
        risk: "Low",
        feasibility: "High",
        tradeoffs: [
          "Stable long-term returns",
          "Limited commercial upside"
        ]
      },
      {
        type: "Cafe / Hotel",
        roi: "High",
        risk: "High",
        feasibility: "Medium",
        tradeoffs: [
          "Tourism dependent demand",
          "Higher regulatory overhead"
        ]
      }
    ],
    decision_guidance:
      "If stability matters more, residential aligns better. If higher volatility is acceptable, hospitality scenarios may be suitable."
  };
}