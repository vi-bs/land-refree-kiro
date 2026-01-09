import { properties } from "./sample_properties.js";

const propertyTypes = ["Residential Housing", "Cafe / Hotel", "Commercial Retail"];

function computeScores(property, user, scenarioType) {
  // Map user inputs to multipliers
  const budgetMult = user.budget === "High" ? 1.2 : user.budget === "Medium" ? 1 : 0.8;
  const riskMult = user.risk_tolerance === "High" ? 1.2 : user.risk_tolerance === "Medium" ? 1 : 0.8;
  const timeMult = user.time_horizon === "Long-term" ? 1.1 : user.time_horizon === "Medium-term" ? 1 : 0.9;

  // Scenario-specific scoring logic
  const footfallScore = property.footfall === "High" ? 3 : property.footfall === "Medium" ? 2 : 1;
  const commercialScore = property.commercial_activity === "High" ? 3 : property.commercial_activity === "Medium" ? 2 : 1;
  const densityScore = property.residential_density === "High" ? 3 : property.residential_density === "Medium" ? 2 : 1;
  const plotSizeScore = property.plot_size_sqft / 1000;

  let roi, risk, feasibility, neighborhoodFit, regulatoryComplexity;

  if (scenarioType === "Residential Housing") {
    roi = (densityScore * 2 + plotSizeScore * 0.5 + 2) * budgetMult;
    risk = (5 - densityScore + plotSizeScore * 0.3) * riskMult;
    feasibility = (8 - plotSizeScore * 0.5 + densityScore * 0.5) * timeMult;
    neighborhoodFit = densityScore * 2 + (commercialScore > 2 ? 1 : 2);
    regulatoryComplexity = 6 + plotSizeScore * 0.3 + (densityScore > 2 ? 1 : 0);
  } else if (scenarioType === "Commercial Retail") {
    roi = (commercialScore * 2 + footfallScore + plotSizeScore * 0.3) * budgetMult;
    risk = (commercialScore + footfallScore + 1) * riskMult;
    feasibility = (7 - plotSizeScore * 0.4 + commercialScore * 0.5) * timeMult;
    neighborhoodFit = commercialScore * 2 + footfallScore;
    regulatoryComplexity = 7 + plotSizeScore * 0.4 + commercialScore * 0.5;
  } else if (scenarioType === "Cafe / Hotel") {
    roi = (footfallScore * 2.5 + commercialScore + plotSizeScore * 0.2) * budgetMult;
    risk = (footfallScore + commercialScore + 2) * riskMult;
    feasibility = (6 - plotSizeScore * 0.3 + footfallScore * 0.5) * timeMult;
    neighborhoodFit = footfallScore * 2 + commercialScore + densityScore * 0.5;
    regulatoryComplexity = 5 + plotSizeScore * 0.2 + footfallScore * 0.3;
  }

  return {
    roi: Math.max(Math.min(roi, 10), 1).toFixed(1),
    risk: Math.max(Math.min(risk, 10), 1).toFixed(1),
    feasibility: Math.max(Math.min(feasibility, 10), 1).toFixed(1),
    neighborhoodFit: Math.max(Math.min(neighborhoodFit, 10), 1).toFixed(1),
    regulatoryComplexity: Math.max(Math.min(regulatoryComplexity, 10), 1).toFixed(1)
  };
}

function generateTradeoffs(type, scores, property, userConstraints) {
  const tradeoffs = [];
  const explanations = [];

  // ROI Analysis
  if (scores.roi > 7.5) {
    tradeoffs.push("High return potential");
    explanations.push(`Strong ROI (${scores.roi}/10) due to favorable ${type.toLowerCase()} market conditions`);
  } else if (scores.roi > 5) {
    tradeoffs.push("Moderate returns expected");
    explanations.push(`Moderate ROI (${scores.roi}/10) - steady but not exceptional returns`);
  } else {
    tradeoffs.push("Lower return expectations");
    explanations.push(`Conservative ROI (${scores.roi}/10) - prioritize stability over growth`);
  }

  // Risk Analysis
  if (scores.risk > 7) {
    tradeoffs.push("High volatility risk");
    explanations.push(`Risk score ${scores.risk}/10 - market fluctuations likely`);
  } else if (scores.risk > 4) {
    tradeoffs.push("Moderate risk profile");
    explanations.push(`Balanced risk (${scores.risk}/10) - monitor market trends`);
  } else {
    tradeoffs.push("Low risk investment");
    explanations.push(`Low risk (${scores.risk}/10) - stable, predictable returns`);
  }

  // Feasibility Analysis
  if (scores.feasibility < 4) {
    tradeoffs.push("Complex development process");
    explanations.push(`Low feasibility (${scores.feasibility}/10) - expect longer timelines`);
  } else if (scores.feasibility > 7) {
    tradeoffs.push("Easy to develop and manage");
    explanations.push(`High feasibility (${scores.feasibility}/10) - straightforward execution`);
  } else {
    tradeoffs.push("Standard development complexity");
    explanations.push(`Moderate feasibility (${scores.feasibility}/10) - typical development challenges`);
  }

  // Neighborhood Fit Analysis
  if (scores.neighborhoodFit > 7) {
    tradeoffs.push("Excellent area alignment");
    explanations.push(`Strong neighborhood fit (${scores.neighborhoodFit}/10) - ${type} suits local demand`);
  } else if (scores.neighborhoodFit < 4) {
    tradeoffs.push("Area mismatch concerns");
    explanations.push(`Poor neighborhood fit (${scores.neighborhoodFit}/10) - ${type} may not align with local needs`);
  }

  // Regulatory Complexity
  if (scores.regulatoryComplexity > 7) {
    tradeoffs.push("Complex permit process");
    explanations.push(`High regulatory complexity (${scores.regulatoryComplexity}/10) - extensive approvals needed`);
  } else if (scores.regulatoryComplexity < 4) {
    tradeoffs.push("Streamlined approvals");
    explanations.push(`Low regulatory complexity (${scores.regulatoryComplexity}/10) - faster permit process`);
  }

  // Conditional guidance based on user constraints
  if (userConstraints.budget === "Low" && scores.roi < 6) {
    explanations.push("⚠️ Low budget + moderate ROI = longer payback period");
  }
  if (userConstraints.risk_tolerance === "Low" && scores.risk > 6) {
    explanations.push("⚠️ Risk score exceeds your low risk tolerance");
  }
  if (userConstraints.time_horizon === "Short-term" && scores.feasibility < 5) {
    explanations.push("⚠️ Low feasibility conflicts with short-term timeline");
  }

  return { tradeoffs, explanations };
}

export function runReferee(userInput) {
  const { budget, risk_tolerance, time_horizon, location } = userInput;

  // FILTER properties based on user location selection (if provided)
  let filteredProperties = properties;
  if (location && location !== "Any") {
    filteredProperties = properties.filter(p => p.location === location);
  }

  // Pick a random property from filtered list
  const property = filteredProperties[Math.floor(Math.random() * filteredProperties.length)];

  const scenarios = propertyTypes.map(type => {
    const scores = computeScores(property, userInput, type);
    const analysis = generateTradeoffs(type, scores, property, userInput);
    return {
      type,
      roi_score: scores.roi,
      risk_score: scores.risk,
      feasibility_score: scores.feasibility,
      neighborhood_fit_score: scores.neighborhoodFit,
      regulatory_complexity_score: scores.regulatoryComplexity,
      tradeoffs: analysis.tradeoffs,
      explanations: analysis.explanations
    };
  });

  // Generate referee-style decision guidance
  const highestROI = scenarios.reduce((prev, current) => (prev.roi_score > current.roi_score) ? prev : current);
  const lowestRisk = scenarios.reduce((prev, current) => (prev.risk_score < current.risk_score) ? prev : current);
  const mostFeasible = scenarios.reduce((prev, current) => (prev.feasibility_score > current.feasibility_score) ? prev : current);

  const refereeGuidance = `
    REFEREE ANALYSIS:
    • If ROI is your priority: ${highestROI.type} shows highest potential (${highestROI.roi_score}/10)
    • If risk minimization matters: ${lowestRisk.type} offers lowest risk (${lowestRisk.risk_score}/10)  
    • If quick execution is key: ${mostFeasible.type} has best feasibility (${mostFeasible.feasibility_score}/10)
    
    Each scenario presents different trade-offs. Your ${budget} budget, ${risk_tolerance} risk tolerance, and ${time_horizon} timeline will determine which factors matter most to your specific situation.
  `.trim();

  return {
    property,
    scenarios,
    decision_guidance: refereeGuidance
  };
}