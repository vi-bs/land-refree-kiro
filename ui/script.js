let radarChart;

// Fetch UI elements
const evaluateBtn = document.getElementById("evaluateBtn");
const resultsDiv = document.getElementById("results");
const chartCanvas = document.getElementById("radarChart");

// Event listener for Evaluate button
evaluateBtn.addEventListener("click", async () => {
  const budget = document.getElementById("budget").value;
  const risk_tolerance = document.getElementById("risk").value;
  const time_horizon = document.getElementById("time").value;
  const location = document.getElementById("location").value;

  try {
    const response = await fetch("http://localhost:3001/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget, risk_tolerance, time_horizon, location })
    });

    const data = await response.json();

    // Clear old results with animation
    resultsDiv.classList.remove("visible");
    chartCanvas.classList.remove("visible");

    setTimeout(() => {
      let html = `<h2>📍 Property: ${data.property.location}</h2>`;
      html += `<div class="property-details">
        <span class="detail">Plot: ${data.property.plot_size_sqft} sqft</span>
        <span class="detail">Footfall: ${data.property.footfall}</span>
        <span class="detail">Commercial Activity: ${data.property.commercial_activity}</span>
      </div>`;
      
      data.scenarios.forEach((s, index) => {
        html += `
          <div class="result-item">
            <strong>${s.type}</strong><br>
            <div class="metrics-grid">
              <span class="badge roi">ROI: ${s.roi_score}</span>
              <span class="badge risk">Risk: ${s.risk_score}</span>
              <span class="badge feasibility">Feasibility: ${s.feasibility_score}</span>
              <span class="badge neighborhood">Area Fit: ${s.neighborhood_fit_score}</span>
              <span class="badge regulatory">Regulatory: ${s.regulatory_complexity_score}</span>
            </div>
            <div class="tradeoffs-section">
              <strong>Trade-offs:</strong> ${s.tradeoffs.map(t => `<span class="tradeoff">${t}</span>`).join(' ')}
            </div>
            <div class="explanations-section">
              ${s.explanations.map(e => `<div class="explanation">• ${e}</div>`).join('')}
            </div>
          </div>
        `;
      });
      html += `<div class="referee-guidance"><strong>🏆 REFEREE GUIDANCE:</strong><pre>${data.decision_guidance}</pre></div>`;
      resultsDiv.innerHTML = html;
      resultsDiv.classList.add("visible");
    }, 200);

    // Enhanced radar chart with all 5 metrics
    const labels = data.scenarios.map(s => s.type);
    const roiData = data.scenarios.map(s => parseFloat(s.roi_score));
    const riskData = data.scenarios.map(s => parseFloat(s.risk_score));
    const feasibilityData = data.scenarios.map(s => parseFloat(s.feasibility_score));
    const neighborhoodData = data.scenarios.map(s => parseFloat(s.neighborhood_fit_score));
    const regulatoryData = data.scenarios.map(s => parseFloat(s.regulatory_complexity_score));

    const chartData = {
      labels,
      datasets: [
        {
          label: "ROI Potential",
          data: roiData,
          borderColor: "#16a34a",
          backgroundColor: "rgba(16,163,74,0.2)"
        },
        {
          label: "Risk Level",
          data: riskData,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220,38,38,0.2)"
        },
        {
          label: "Feasibility",
          data: feasibilityData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.2)"
        },
        {
          label: "Area Fit",
          data: neighborhoodData,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124,58,237,0.2)"
        },
        {
          label: "Regulatory Complexity",
          data: regulatoryData,
          borderColor: "#ea580c",
          backgroundColor: "rgba(234,88,12,0.2)"
        }
      ]
    };

    const config = {
      type: "radar",
      data: chartData,
      options: {
        responsive: true,
        animation: { duration: 1000 },
        scales: { r: { min: 0, max: 10 } },
        plugins: { legend: { position: 'top' } }
      }
    };

    if (radarChart) radarChart.destroy();
    radarChart = new Chart(chartCanvas.getContext("2d"), config);
    chartCanvas.classList.add("visible");

  } catch (err) {
    alert("Failed to fetch from backend. Make sure backend is running.");
    console.error(err);
  }
});