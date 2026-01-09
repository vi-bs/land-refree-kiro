let radarChart;

document.getElementById("evaluateBtn").addEventListener("click", async () => {
  const budget = document.getElementById("budget").value;
  const risk_tolerance = document.getElementById("risk").value;
  const time_horizon = document.getElementById("time").value;

  try {
    const response = await fetch("http://localhost:3000/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget, risk_tolerance, time_horizon })
    });
    const data = await response.json();

    const resultsDiv = document.getElementById("results");
    const chartCanvas = document.getElementById("radarChart");

    // Clear old results
    resultsDiv.classList.remove("visible");
    chartCanvas.classList.remove("visible");
    setTimeout(() => {
      let html = `<h2>📍 Property: ${data.property.location}</h2>`;
      data.scenarios.forEach((s, index) => {
        html += `
          <div class="result-item">
            <strong>${index === 0 ? "🏆 " : ""}${s.type}</strong><br>
            <span class="badge roi">ROI: ${s.roi_score}</span>
            <span class="badge risk">Risk: ${s.risk_score}</span>
            <span class="badge feasibility">Feasibility: ${s.feasibility_score}</span><br>
            Trade-offs: ${s.tradeoffs.map(t => `<span class="tradeoff">${t}</span>`).join(' ')}
          </div>
        `;
      });
      html += `<p><em>${data.decision_guidance}</em></p>`;
      resultsDiv.innerHTML = html;
      resultsDiv.classList.add("visible");
    }, 200);

    // Radar chart animation
    const labels = data.scenarios.map(s => s.type);
    const roiData = data.scenarios.map(s => s.roi_score);
    const riskData = data.scenarios.map(s => s.risk_score);
    const feasibilityData = data.scenarios.map(s => s.feasibility_score);

    const chartData = {
      labels,
      datasets: [
        { label: "ROI", data: roiData, borderColor: "#16a34a", backgroundColor: "rgba(16,163,74,0.3)" },
        { label: "Risk", data: riskData, borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,0.3)" },
        { label: "Feasibility", data: feasibilityData, borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.3)" }
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