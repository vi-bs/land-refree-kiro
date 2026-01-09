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

    // Display textual results
    let html = `<h2>Property: ${data.property.location}</h2>`;
    html += `<ul>`;
    data.scenarios.forEach(s => {
      html += `<li><strong>${s.type}</strong> - ROI: ${s.roi_score}, Risk: ${s.risk_score}, Feasibility: ${s.feasibility_score}<br>`;
      html += `Trade-offs: ${s.tradeoffs.join(", ")}</li><br>`;
    });
    html += `</ul>`;
    html += `<p><em>${data.decision_guidance}</em></p>`;

    resultsDiv.innerHTML = html;

    // Prepare radar chart
    const labels = data.scenarios.map(s => s.type);
    const roiData = data.scenarios.map(s => s.roi_score);
    const riskData = data.scenarios.map(s => s.risk_score);
    const feasibilityData = data.scenarios.map(s => s.feasibility_score);

    const chartData = {
      labels,
      datasets: [
        {
          label: "ROI",
          data: roiData,
          borderColor: "green",
          backgroundColor: "rgba(0,128,0,0.2)",
        },
        {
          label: "Risk",
          data: riskData,
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
        },
        {
          label: "Feasibility",
          data: feasibilityData,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
        },
      ],
    };

    const config = {
      type: "radar",
      data: chartData,
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 10,
          },
        },
      },
    };

    if (radarChart) {
      radarChart.destroy();
    }
    const ctx = document.getElementById("radarChart").getContext("2d");
    radarChart = new Chart(ctx, config);

  } catch (err) {
    alert("Failed to fetch from backend. Make sure backend is running.");
    console.error(err);
  }
});