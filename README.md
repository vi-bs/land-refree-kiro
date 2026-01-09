# LandReferee – Constraint-Aware Real Estate Decision Assistant

**The system compares multiple development scenarios for a property under user-defined constraints and explains trade-offs using Kiro, allowing users to make informed decisions.**

## 🏆 Referee Approach
LandReferee acts as a neutral referee, not an advisor. Instead of recommending the "best" investment, it:
- Compares scenarios across 5 key metrics
- Explains why each scenario scores differently  
- Highlights trade-offs and constraints conflicts
- Uses conditional guidance ("If X is your priority, then Y scenario offers...")
- Provides constraint-aware warnings

## 📊 5 Comprehensive Metrics
1. **ROI Potential** - Expected returns based on scenario and location
2. **Risk Level** - Volatility and market uncertainty factors
3. **Build Feasibility** - Zoning, construction ease, and timeline
4. **Neighborhood Fit** - How well the scenario suits local demand
5. **Regulatory Complexity** - Permit requirements and approval processes

## 🎯 Scope (Bangalore Focus)
- **Location:** Bangalore neighborhoods (Indiranagar, Koramangala, MG Road, etc.)
- **Scenarios:** Residential Housing, Commercial Retail, Cafe/Hotel
- **Data:** Curated property profiles with footfall, density, and commercial activity
- **Constraints:** Budget, risk tolerance, time horizon

## 🚀 Quick Start
```bash
# Start backend (port 3001)
npm start

# Open frontend
open ui/index.html

# Test API
curl -X POST http://localhost:3001/evaluate \
  -H "Content-Type: application/json" \
  -d '{"budget":"Medium","risk_tolerance":"Low","time_horizon":"Long-term","location":"Indiranagar, Bangalore"}'
```

## 🏗️ Architecture
```
UI (Node.js) → Express Backend → Referee Logic → Kiro Analysis → Structured JSON
```

## 📋 Example Output
```
REFEREE ANALYSIS:
• If ROI is your priority: Cafe/Hotel shows highest potential (10.0/10)
• If risk minimization matters: Residential Housing offers lowest risk (2.2/10)  
• If quick execution is key: Residential Housing has best feasibility (9.1/10)

⚠️ Risk score exceeds your low risk tolerance
```

## 🎓 Built for AI for Bharat – Week 6 (The Referee)
This project demonstrates constraint-aware AI reasoning that educates rather than prescribes, helping users make informed real estate decisions through neutral, trade-off based analysis.