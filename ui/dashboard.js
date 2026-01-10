// Enhanced Dashboard Controller
class LandRefereeDashboard {
  constructor() {
    this.analysisData = null;
    this.currentTab = 'welcome';
    this.charts = {};
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTabNavigation();
    this.initializeCharts();
    this.loadLocationData();
  }

  setupEventListeners() {
    // Form submission
    const form = document.getElementById('investmentForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Location tabs
    document.querySelectorAll('.location-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchLocationTab(e.target.closest('.location-tab')));
    });
  }

  setupTabNavigation() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.closest('.tab-item').dataset.tab;
        this.switchTab(tabName);
        
        // Force chart creation for residential tab
        if (tabName === 'residential-insights') {
          setTimeout(() => {
            console.log('Forcing amenities chart creation...');
            this.createAmenitiesImpactChart();
          }, 1000);
        }
      });
    });
  }

  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    this.currentTab = tabName;
    
    // Animate tab transition
    gsap.fromTo(`#${tabName}`, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );

    // Initialize tab-specific content with delay to ensure DOM is ready
    setTimeout(() => {
      if (tabName === 'commercial-trends') {
        console.log('Initializing commercial charts...');
        this.initializeCommercialCharts();
      } else if (tabName === 'residential-insights') {
        console.log('Initializing residential charts...');
        this.initializeResidentialCharts();
      } else if (tabName === 'location-facts') {
        this.initializeLocationCharts();
      }
    }, 300);
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      location: formData.get('location') || document.getElementById('locationSelect').value,
      budget: formData.get('budget'),
      risk_tolerance: formData.get('risk'),
      time_horizon: formData.get('timeline')
    };

    // Validate form
    if (!data.location || !data.budget || !data.risk_tolerance || !data.time_horizon) {
      this.showError('Please fill in all fields before starting analysis.');
      return;
    }

    // Show loading state
    this.showLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.analysisData = await response.json();
      
      // Hide loading and switch to analysis tab
      setTimeout(() => {
        this.showLoading(false);
        this.switchTab('analysis');
        this.renderAnalysisResults();
      }, 1500);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      this.showLoading(false);
      this.showError('Analysis failed. Please make sure the backend server is running on port 3001.');
    }
  }

  showLoading(show) {
    const button = document.querySelector('.analyze-button');
    const loader = button.querySelector('.button-loader');
    
    if (show) {
      button.classList.add('loading');
      button.disabled = true;
      loader.style.display = 'block';
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      loader.style.display = 'none';
    }
  }

  showError(message) {
    // Create or update error message
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      document.querySelector('.form-actions').appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  renderAnalysisResults() {
    if (!this.analysisData) return;

    this.renderPropertySummary();
    this.renderScenarioCards();
    this.renderRadarChart();
    this.renderRefereeAnalysis();
    this.renderTradeoffs();
    this.renderDecisionFlowchart();
  }

  renderPropertySummary() {
    const property = this.analysisData.property;
    const summary = document.getElementById('propertySummary');
    
    summary.innerHTML = `
      <div class="property-card">
        <div class="property-header">
          <h3><i class="fas fa-map-marker-alt"></i> ${property.location}</h3>
          <span class="property-id">${property.property_id}</span>
        </div>
        <div class="property-details">
          <div class="detail-item">
            <i class="fas fa-ruler-combined"></i>
            <span class="detail-label">Plot Size</span>
            <span class="detail-value">${property.plot_size_sqft} sqft</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-walking"></i>
            <span class="detail-label">Footfall</span>
            <span class="detail-value">${property.footfall}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-building"></i>
            <span class="detail-label">Density</span>
            <span class="detail-value">${property.residential_density}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-store"></i>
            <span class="detail-label">Commercial Activity</span>
            <span class="detail-value">${property.commercial_activity}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderScenarioCards() {
    const scenarios = this.analysisData.scenarios;
    
    scenarios.forEach((scenario, index) => {
      const cardTypes = ['residential', 'commercial', 'hospitality'];
      const cardType = cardTypes[index];
      
      // Render speedometer
      this.renderSpeedometer(`${cardType}Speedometer`, parseFloat(scenario.roi_score));
      
      // Render metrics
      this.renderScenarioMetrics(cardType, scenario);
      
      // Render highlights
      this.renderScenarioHighlights(cardType, scenario);
    });
  }

  renderSpeedometer(canvasId, value) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = 100;
    const centerY = 80;
    const radius = 60;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw value arc
    const angle = Math.PI + (value / 10) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angle);
    
    // Color based on value
    if (value >= 7) ctx.strokeStyle = '#10b981';
    else if (value >= 4) ctx.strokeStyle = '#f59e0b';
    else ctx.strokeStyle = '#ef4444';
    
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw needle
    const needleAngle = Math.PI + (value / 10) * Math.PI;
    const needleX = centerX + Math.cos(needleAngle) * (radius - 15);
    const needleY = centerY + Math.sin(needleAngle) * (radius - 15);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    
    // Draw value text
    ctx.font = 'bold 14px Inter';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText(`${value}/10`, centerX, centerY + 25);
  }

  renderScenarioMetrics(cardType, scenario) {
    const metricsContainer = document.getElementById(`${cardType}Metrics`);
    if (!metricsContainer) return;
    
    metricsContainer.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-icon"><i class="fas fa-chart-line"></i></span>
          <div class="metric-content">
            <span class="metric-label">ROI Potential</span>
            <span class="metric-value roi">${scenario.roi_score}/10</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-icon"><i class="fas fa-exclamation-triangle"></i></span>
          <div class="metric-content">
            <span class="metric-label">Risk Level</span>
            <span class="metric-value risk">${scenario.risk_score}/10</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-icon"><i class="fas fa-tools"></i></span>
          <div class="metric-content">
            <span class="metric-label">Feasibility</span>
            <span class="metric-value feasibility">${scenario.feasibility_score}/10</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-icon"><i class="fas fa-map-marked-alt"></i></span>
          <div class="metric-content">
            <span class="metric-label">Area Fit</span>
            <span class="metric-value area-fit">${scenario.neighborhood_fit_score}/10</span>
          </div>
        </div>
        <div class="metric-item">
          <span class="metric-icon"><i class="fas fa-gavel"></i></span>
          <div class="metric-content">
            <span class="metric-label">Regulatory</span>
            <span class="metric-value regulatory">${scenario.regulatory_complexity_score}/10</span>
          </div>
        </div>
      </div>
    `;
  }

  renderScenarioHighlights(cardType, scenario) {
    const highlightsContainer = document.getElementById(`${cardType}Highlights`);
    if (!highlightsContainer) return;
    
    highlightsContainer.innerHTML = `
      <div class="highlights-section">
        <h4><i class="fas fa-star"></i> Key Highlights</h4>
        <div class="highlights-list">
          ${scenario.tradeoffs.slice(0, 3).map(tradeoff => `
            <div class="highlight-item">
              <i class="fas fa-check-circle"></i>
              <span>${tradeoff}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderRadarChart() {
    const ctx = document.getElementById('comparisonRadar');
    if (!ctx) return;
    
    const scenarios = this.analysisData.scenarios;
    
    // Destroy existing chart if it exists
    if (this.charts.radar) {
      this.charts.radar.destroy();
    }
    
    const data = {
      labels: ['ROI Potential', 'Risk Level', 'Feasibility', 'Area Fit', 'Regulatory'],
      datasets: scenarios.map((scenario, index) => {
        const colors = [
          { border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
          { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
          { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
        ];
        
        return {
          label: scenario.type,
          data: [
            parseFloat(scenario.roi_score),
            parseFloat(scenario.risk_score),
            parseFloat(scenario.feasibility_score),
            parseFloat(scenario.neighborhood_fit_score),
            parseFloat(scenario.regulatory_complexity_score)
          ],
          borderColor: colors[index].border,
          backgroundColor: colors[index].bg,
          borderWidth: 3,
          pointBackgroundColor: colors[index].border,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        };
      })
    };
    
    this.charts.radar = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              font: { size: 12 },
              color: '#6b7280'
            },
            grid: { color: 'rgba(107, 114, 128, 0.2)' },
            angleLines: { color: 'rgba(107, 114, 128, 0.2)' },
            pointLabels: {
              font: { size: 14, weight: 'bold' },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: false // We'll use custom legend
          }
        }
      }
    });
  }

  renderRefereeAnalysis() {
    const refereeGuidance = document.getElementById('refereeGuidance');
    if (!refereeGuidance) return;
    
    refereeGuidance.innerHTML = `
      <div class="referee-card">
        <div class="referee-header">
          <i class="fas fa-robot"></i>
          <h3>AI Referee Decision Analysis</h3>
        </div>
        <div class="referee-content">
          <pre class="referee-text">${this.analysisData.decision_guidance}</pre>
        </div>
      </div>
    `;
  }

  renderTradeoffs() {
    const tradeoffsGrid = document.getElementById('tradeoffsGrid');
    if (!tradeoffsGrid) return;
    
    tradeoffsGrid.innerHTML = this.analysisData.scenarios.map((scenario, index) => {
      const colors = ['#10b981', '#f59e0b', '#ef4444'];
      const icons = ['fas fa-home', 'fas fa-store', 'fas fa-coffee'];
      
      return `
        <div class="tradeoff-card" style="border-left: 4px solid ${colors[index]}">
          <div class="tradeoff-header">
            <i class="${icons[index]}"></i>
            <h3>${scenario.type}</h3>
          </div>
          <div class="tradeoff-content">
            <h4>Detailed Analysis</h4>
            <div class="explanations-list">
              ${scenario.explanations.map(explanation => `
                <div class="explanation-item">
                  <i class="fas fa-lightbulb"></i>
                  <span>${explanation}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDecisionFlowchart() {
    const flowchartContainer = document.getElementById('decisionFlowchart');
    if (!flowchartContainer) return;
    
    const scenarios = this.analysisData.scenarios;
    const highestROI = scenarios.reduce((prev, current) => 
      parseFloat(prev.roi_score) > parseFloat(current.roi_score) ? prev : current
    );
    const lowestRisk = scenarios.reduce((prev, current) => 
      parseFloat(prev.risk_score) < parseFloat(current.risk_score) ? prev : current
    );
    const mostFeasible = scenarios.reduce((prev, current) => 
      parseFloat(prev.feasibility_score) > parseFloat(current.feasibility_score) ? prev : current
    );
    
    flowchartContainer.innerHTML = `
      <div class="flowchart">
        <div class="flow-node start-node">
          <i class="fas fa-play"></i>
          <span>Investment Decision</span>
        </div>
        
        <div class="flow-branches">
          <div class="flow-branch">
            <div class="flow-node priority-node">
              <i class="fas fa-chart-line"></i>
              <span>ROI Priority</span>
            </div>
            <div class="flow-arrow"></div>
            <div class="flow-node result-node roi-result">
              <i class="fas fa-trophy"></i>
              <span>${highestROI.type}</span>
              <small>${highestROI.roi_score}/10 ROI</small>
            </div>
          </div>
          
          <div class="flow-branch">
            <div class="flow-node priority-node">
              <i class="fas fa-shield-alt"></i>
              <span>Risk Minimization</span>
            </div>
            <div class="flow-arrow"></div>
            <div class="flow-node result-node risk-result">
              <i class="fas fa-check-circle"></i>
              <span>${lowestRisk.type}</span>
              <small>${lowestRisk.risk_score}/10 Risk</small>
            </div>
          </div>
          
          <div class="flow-branch">
            <div class="flow-node priority-node">
              <i class="fas fa-clock"></i>
              <span>Quick Execution</span>
            </div>
            <div class="flow-arrow"></div>
            <div class="flow-node result-node feasibility-result">
              <i class="fas fa-rocket"></i>
              <span>${mostFeasible.type}</span>
              <small>${mostFeasible.feasibility_score}/10 Feasibility</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  switchLocationTab(tab) {
    document.querySelectorAll('.location-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const location = tab.dataset.location;
    this.loadLocationData(location);
    
    // Animate tab switch
    gsap.fromTo('.location-content', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }

  loadLocationData(location = 'indiranagar') {
    const locationData = this.getLocationData(location);
    this.renderLocationContent(locationData);
  }

  getLocationData(location) {
    const data = {
      indiranagar: {
        name: 'Indiranagar',
        type: 'Premium Commercial Hub',
        overview: {
          area: '12.5 sq km',
          population: '85,000+',
          growth: '12% annually',
          avgPrice: '₹14,500/sqft'
        },
        marketDynamics: {
          demand: 85,
          supply: 60,
          appreciation: 78
        },
        infrastructure: [
          { type: 'Metro', name: 'Indiranagar Metro Station', distance: '400m', status: 'excellent' },
          { type: 'Bus', name: '15+ BMTC routes', distance: '24/7 service', status: 'good' },
          { type: 'Road', name: '100ft Road, CMH Road', distance: 'Direct access', status: 'excellent' }
        ],
        demographics: {
          avgAge: 32,
          avgIncome: '₹12 LPA',
          education: '85% Graduate+',
          ageGroups: [40, 30, 20, 10] // 25-35, 35-45, 45-55, 55+
        },
        hotspots: [
          { name: '100ft Road Corridor', desc: 'Prime commercial strip with high footfall', roi: '15-18%', appreciation: '12%', potential: 'high' },
          { name: 'CMH Road Junction', desc: 'Emerging commercial hub near metro', roi: '12-15%', appreciation: '10%', potential: 'medium' }
        ],
        futureProjects: [
          { timeline: '2024-2026', name: 'Metro Line Extension', desc: 'Purple line extension to improve connectivity', impact: '+15% Property Value' },
          { timeline: '2025-2027', name: 'Commercial Complex', desc: 'New shopping mall and office spaces', impact: '+20% Commercial Rent' }
        ],
        risks: [
          { type: 'Market Stability', desc: 'Established area with consistent demand', level: 'low' },
          { type: 'Traffic Congestion', desc: 'Peak hour traffic may affect accessibility', level: 'medium' },
          { type: 'Regulatory Environment', desc: 'Clear zoning laws and stable policies', level: 'low' }
        ]
      },
      koramangala: {
        name: 'Koramangala',
        type: 'Tech Startup District',
        overview: {
          area: '8.2 sq km',
          population: '65,000+',
          growth: '18% annually',
          avgPrice: '₹11,200/sqft'
        },
        marketDynamics: {
          demand: 92,
          supply: 45,
          appreciation: 85
        },
        infrastructure: [
          { type: 'Metro', name: 'Koramangala Metro (Under Construction)', distance: '800m', status: 'good' },
          { type: 'Bus', name: '20+ BMTC routes', distance: 'Multiple stops', status: 'excellent' },
          { type: 'Road', name: 'Hosur Road, Ring Road', distance: 'Major connectivity', status: 'good' }
        ],
        demographics: {
          avgAge: 28,
          avgIncome: '₹15 LPA',
          education: '92% Graduate+',
          ageGroups: [55, 25, 15, 5] // Young professional hub
        },
        hotspots: [
          { name: '5th Block Commercial', desc: 'Startup and cafe ecosystem hub', roi: '20-25%', appreciation: '15%', potential: 'high' },
          { name: 'Forum Mall Area', desc: 'Established retail and entertainment zone', roi: '16-20%', appreciation: '12%', potential: 'high' }
        ],
        futureProjects: [
          { timeline: '2024-2025', name: 'Metro Station Completion', desc: 'Direct metro connectivity', impact: '+25% Property Value' },
          { timeline: '2025-2026', name: 'Tech Park Expansion', desc: 'New IT companies setup', impact: '+18% Rental Demand' }
        ],
        risks: [
          { type: 'Market Volatility', desc: 'Startup ecosystem dependent on tech trends', level: 'medium' },
          { type: 'Infrastructure Load', desc: 'High density causing strain on utilities', level: 'medium' },
          { type: 'Competition', desc: 'High competition for commercial spaces', level: 'high' }
        ]
      },
      whitefield: {
        name: 'Whitefield',
        type: 'IT Corridor Expansion',
        overview: {
          area: '25.8 sq km',
          population: '120,000+',
          growth: '25% annually',
          avgPrice: '₹7,800/sqft'
        },
        marketDynamics: {
          demand: 75,
          supply: 85,
          appreciation: 95
        },
        infrastructure: [
          { type: 'Metro', name: 'Whitefield Metro Station', distance: '1.2km', status: 'good' },
          { type: 'Bus', name: '12+ BMTC routes', distance: 'IT corridor service', status: 'good' },
          { type: 'Road', name: 'ITPL Road, Varthur Road', distance: 'IT connectivity', status: 'excellent' }
        ],
        demographics: {
          avgAge: 30,
          avgIncome: '₹18 LPA',
          education: '88% Graduate+',
          ageGroups: [45, 35, 15, 5] // IT professionals
        },
        hotspots: [
          { name: 'ITPL Corridor', desc: 'Major IT companies and supporting businesses', roi: '18-22%', appreciation: '20%', potential: 'high' },
          { name: 'Phoenix Marketcity Area', desc: 'Retail and entertainment hub', roi: '14-18%', appreciation: '15%', potential: 'medium' }
        ],
        futureProjects: [
          { timeline: '2024-2026', name: 'Peripheral Ring Road', desc: 'Better connectivity to other IT hubs', impact: '+30% Accessibility' },
          { timeline: '2025-2028', name: 'New IT Parks', desc: 'Additional tech company setups', impact: '+25% Employment' }
        ],
        risks: [
          { type: 'Distance from City', desc: 'Far from central Bangalore', level: 'medium' },
          { type: 'Infrastructure Development', desc: 'Dependent on government projects', level: 'medium' },
          { type: 'IT Industry Cycles', desc: 'Vulnerable to tech industry downturns', level: 'medium' }
        ]
      },
      hsr: {
        name: 'HSR Layout',
        type: 'Residential Paradise',
        overview: {
          area: '15.2 sq km',
          population: '95,000+',
          growth: '15% annually',
          avgPrice: '₹9,500/sqft'
        },
        marketDynamics: {
          demand: 88,
          supply: 70,
          appreciation: 82
        },
        infrastructure: [
          { type: 'Metro', name: 'HSR Layout Metro Station', distance: '600m', status: 'excellent' },
          { type: 'Bus', name: '18+ BMTC routes', distance: 'Comprehensive coverage', status: 'excellent' },
          { type: 'Road', name: 'Outer Ring Road, Bannerghatta Road', distance: 'Major roads', status: 'good' }
        ],
        demographics: {
          avgAge: 35,
          avgIncome: '₹14 LPA',
          education: '90% Graduate+',
          ageGroups: [35, 40, 20, 5] // Family-oriented
        },
        hotspots: [
          { name: 'Sector 1 Commercial', desc: 'Family-oriented retail and services', roi: '12-16%', appreciation: '10%', potential: 'medium' },
          { name: 'BDA Complex Area', desc: 'Government offices and commercial activity', roi: '14-18%', appreciation: '12%', potential: 'medium' }
        ],
        futureProjects: [
          { timeline: '2024-2025', name: 'School Infrastructure', desc: 'New international schools', impact: '+12% Family Appeal' },
          { timeline: '2025-2027', name: 'Healthcare Hub', desc: 'Multi-specialty hospital', impact: '+15% Property Value' }
        ],
        risks: [
          { type: 'Residential Saturation', desc: 'High supply of residential properties', level: 'medium' },
          { type: 'Commercial Viability', desc: 'Limited commercial opportunities', level: 'low' },
          { type: 'Traffic Management', desc: 'Growing traffic congestion', level: 'medium' }
        ]
      },
      mgroad: {
        name: 'MG Road',
        type: 'Business Center',
        overview: {
          area: '6.8 sq km',
          population: '45,000+',
          growth: '8% annually',
          avgPrice: '₹18,500/sqft'
        },
        marketDynamics: {
          demand: 95,
          supply: 35,
          appreciation: 65
        },
        infrastructure: [
          { type: 'Metro', name: 'MG Road Metro Station', distance: '200m', status: 'excellent' },
          { type: 'Bus', name: '25+ BMTC routes', distance: 'Central hub', status: 'excellent' },
          { type: 'Road', name: 'MG Road, Brigade Road', distance: 'Prime location', status: 'excellent' }
        ],
        demographics: {
          avgAge: 38,
          avgIncome: '₹20 LPA',
          education: '95% Graduate+',
          ageGroups: [30, 35, 25, 10] // Business professionals
        },
        hotspots: [
          { name: 'Brigade Road', desc: 'Premium shopping and dining destination', roi: '10-14%', appreciation: '8%', potential: 'high' },
          { name: 'Commercial Street', desc: 'Traditional shopping area', roi: '12-16%', appreciation: '10%', potential: 'medium' }
        ],
        futureProjects: [
          { timeline: '2024-2025', name: 'Heritage Conservation', desc: 'Preserving historical buildings', impact: '+5% Tourism Value' },
          { timeline: '2025-2026', name: 'Pedestrian Plaza', desc: 'Car-free shopping zones', impact: '+20% Footfall' }
        ],
        risks: [
          { type: 'High Property Prices', desc: 'Premium pricing limits affordability', level: 'high' },
          { type: 'Space Constraints', desc: 'Limited availability for expansion', level: 'high' },
          { type: 'Parking Issues', desc: 'Limited parking in central area', level: 'medium' }
        ]
      }
    };
    
    return data[location] || data.indiranagar;
  }

  renderLocationContent(data) {
    const container = document.getElementById('locationContent');
    
    container.innerHTML = `
      <!-- Location Overview -->
      <div class="location-overview-section">
        <div class="overview-header">
          <h2><i class="fas fa-info-circle"></i> ${data.name} Overview</h2>
          <span class="location-type">${data.type}</span>
        </div>
        <div class="overview-stats-grid">
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-map"></i></div>
            <div class="stat-content">
              <div class="stat-value">${data.overview.area}</div>
              <div class="stat-label">Total Area</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-content">
              <div class="stat-value">${data.overview.population}</div>
              <div class="stat-label">Population</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
            <div class="stat-content">
              <div class="stat-value">${data.overview.growth}</div>
              <div class="stat-label">Growth Rate</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-rupee-sign"></i></div>
            <div class="stat-content">
              <div class="stat-value">${data.overview.avgPrice}</div>
              <div class="stat-label">Avg Property Price</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Dynamics -->
      <div class="market-dynamics-section">
        <h2><i class="fas fa-chart-bar"></i> Market Dynamics</h2>
        <div class="dynamics-grid">
          <div class="dynamic-item">
            <div class="dynamic-header">
              <span class="dynamic-label">Demand Index</span>
              <span class="dynamic-value">${data.marketDynamics.demand}/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill demand" style="width: ${data.marketDynamics.demand}%"></div>
            </div>
          </div>
          <div class="dynamic-item">
            <div class="dynamic-header">
              <span class="dynamic-label">Supply Availability</span>
              <span class="dynamic-value">${data.marketDynamics.supply}/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill supply" style="width: ${data.marketDynamics.supply}%"></div>
            </div>
          </div>
          <div class="dynamic-item">
            <div class="dynamic-header">
              <span class="dynamic-label">Price Appreciation</span>
              <span class="dynamic-value">${data.marketDynamics.appreciation}/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill appreciation" style="width: ${data.marketDynamics.appreciation}%"></div>
            </div>
          </div>
        </div>
        <div class="dynamics-chart">
          <canvas id="marketDynamicsChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Infrastructure Analysis -->
      <div class="infrastructure-section">
        <h2><i class="fas fa-road"></i> Infrastructure Analysis</h2>
        <div class="infrastructure-grid">
          ${data.infrastructure.map(infra => `
            <div class="infra-card">
              <div class="infra-icon">
                <i class="fas fa-${infra.type === 'Metro' ? 'subway' : infra.type === 'Bus' ? 'bus' : 'car'}"></i>
              </div>
              <div class="infra-content">
                <h3>${infra.name}</h3>
                <p>${infra.distance}</p>
                <span class="status ${infra.status}">${infra.status.charAt(0).toUpperCase() + infra.status.slice(1)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Demographics & Investment Hotspots -->
      <div class="analysis-grid">
        <div class="demographics-section">
          <h2><i class="fas fa-users"></i> Demographics Profile</h2>
          <div class="demo-chart-container">
            <canvas id="locationDemographicsChart" width="250" height="200"></canvas>
          </div>
          <div class="demo-stats-grid">
            <div class="demo-stat">
              <span class="demo-label">Average Age</span>
              <span class="demo-value">${data.demographics.avgAge} years</span>
            </div>
            <div class="demo-stat">
              <span class="demo-label">Average Income</span>
              <span class="demo-value">${data.demographics.avgIncome}</span>
            </div>
            <div class="demo-stat">
              <span class="demo-label">Education Level</span>
              <span class="demo-value">${data.demographics.education}</span>
            </div>
          </div>
        </div>

        <div class="hotspots-section">
          <h2><i class="fas fa-fire"></i> Investment Hotspots</h2>
          <div class="hotspots-list">
            ${data.hotspots.map(hotspot => `
              <div class="hotspot-card ${hotspot.potential}">
                <div class="hotspot-header">
                  <h3>${hotspot.name}</h3>
                  <span class="potential-badge ${hotspot.potential}">${hotspot.potential.charAt(0).toUpperCase() + hotspot.potential.slice(1)} Potential</span>
                </div>
                <p>${hotspot.desc}</p>
                <div class="hotspot-metrics">
                  <div class="metric">
                    <span class="metric-label">ROI Range</span>
                    <span class="metric-value">${hotspot.roi}</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Appreciation</span>
                    <span class="metric-value">${hotspot.appreciation}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Future Developments Timeline -->
      <div class="future-developments">
        <h2><i class="fas fa-rocket"></i> Future Development Pipeline</h2>
        <div class="timeline">
          ${data.futureProjects.map((project, index) => `
            <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-year">${project.timeline}</div>
                <h3>${project.name}</h3>
                <p>${project.desc}</p>
                <span class="impact-badge">${project.impact}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="risk-assessment">
        <h2><i class="fas fa-exclamation-triangle"></i> Risk Assessment Matrix</h2>
        <div class="risk-grid">
          ${data.risks.map(risk => `
            <div class="risk-card ${risk.level}-risk">
              <div class="risk-header">
                <h3>${risk.type}</h3>
                <span class="risk-level ${risk.level}">${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk</span>
              </div>
              <p>${risk.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Initialize charts after content is rendered
    setTimeout(() => {
      this.createLocationCharts(data);
    }, 100);
  }

  createLocationCharts(data) {
    // Market Dynamics Chart
    const marketCtx = document.getElementById('marketDynamicsChart');
    if (marketCtx) {
      new Chart(marketCtx, {
        type: 'radar',
        data: {
          labels: ['Demand Index', 'Supply Availability', 'Price Appreciation'],
          datasets: [{
            label: data.name,
            data: [data.marketDynamics.demand, data.marketDynamics.supply, data.marketDynamics.appreciation],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderWidth: 3,
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { stepSize: 20, font: { size: 10 } },
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              angleLines: { color: 'rgba(0, 0, 0, 0.1)' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Demographics Chart
    const demoCtx = document.getElementById('locationDemographicsChart');
    if (demoCtx) {
      new Chart(demoCtx, {
        type: 'doughnut',
        data: {
          labels: ['25-35 years', '35-45 years', '45-55 years', '55+ years'],
          datasets: [{
            data: data.demographics.ageGroups,
            backgroundColor: ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 10 } }
            }
          }
        }
      });
    }
  }

  initializeCharts() {
    // Initialize any default charts
  }

  initializeCommercialCharts() {
    // Initialize commercial sector charts
    setTimeout(() => {
      this.createCommercialKPICharts();
      this.createSectorPieChart();
      this.createSectorTrendCharts();
      this.animateBusinessMatrix();
    }, 100);
  }

  createCommercialKPICharts() {
    // Rent Trend Chart
    const rentCtx = document.getElementById('rentTrendChart');
    if (rentCtx) {
      new Chart(rentCtx, {
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            data: [165, 172, 178, 185],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Occupancy Chart
    const occupancyCtx = document.getElementById('occupancyChart');
    if (occupancyCtx) {
      new Chart(occupancyCtx, {
        type: 'doughnut',
        data: {
          labels: ['Occupied', 'Vacant'],
          datasets: [{
            data: [82, 18],
            backgroundColor: ['#3b82f6', '#e5e7eb'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Supply Chart
    const supplyCtx = document.getElementById('supplyChart');
    if (supplyCtx) {
      new Chart(supplyCtx, {
        type: 'bar',
        data: {
          labels: ['2022', '2023', '2024'],
          datasets: [{
            data: [2.2, 2.5, 2.8],
            backgroundColor: ['#f59e0b', '#f59e0b', '#f59e0b'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Business Chart
    const businessCtx = document.getElementById('businessChart');
    if (businessCtx) {
      new Chart(businessCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            data: [400, 450, 480, 520],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  }

  createSectorPieChart() {
    const ctx = document.getElementById('sectorPieChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts.sectorPie) {
      this.charts.sectorPie.destroy();
    }

    this.charts.sectorPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Retail', 'F&B', 'Co-working', 'Services'],
        datasets: [{
          data: [35, 28, 22, 15],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverBorderWidth: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed}%`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  createSectorTrendCharts() {
    // Retail Trend Chart
    const retailCtx = document.getElementById('retailTrendChart');
    if (retailCtx) {
      new Chart(retailCtx, {
        type: 'line',
        data: {
          labels: ['2021', '2022', '2023', '2024'],
          datasets: [{
            data: [65, 70, 75, 82],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // F&B Trend Chart
    const fnbCtx = document.getElementById('fnbTrendChart');
    if (fnbCtx) {
      new Chart(fnbCtx, {
        type: 'line',
        data: {
          labels: ['2021', '2022', '2023', '2024'],
          datasets: [{
            data: [55, 65, 78, 88],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Co-working Trend Chart
    const coworkingCtx = document.getElementById('coworkingTrendChart');
    if (coworkingCtx) {
      new Chart(coworkingCtx, {
        type: 'line',
        data: {
          labels: ['2021', '2022', '2023', '2024'],
          datasets: [{
            data: [25, 40, 65, 85],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Success Stories Charts
    this.createSuccessStoriesCharts();
  }

  createSuccessStoriesCharts() {
    // Success by Sector Chart
    const successSectorCtx = document.getElementById('successBySectorChart');
    if (successSectorCtx) {
      // Destroy existing chart if it exists
      if (this.charts.successSector) {
        this.charts.successSector.destroy();
      }

      this.charts.successSector = new Chart(successSectorCtx, {
        type: 'doughnut',
        data: {
          labels: ['F&B', 'Tech/Co-working', 'Retail', 'Services'],
          datasets: [{
            data: [42, 28, 20, 10],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
            borderWidth: 4,
            borderColor: '#fff',
            hoverBorderWidth: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2500,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed}% (${Math.round(context.parsed * 5)} stories)`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Investment Range Chart
    const investmentRangeCtx = document.getElementById('investmentRangeChart');
    if (investmentRangeCtx) {
      // Destroy existing chart if it exists
      if (this.charts.investmentRange) {
        this.charts.investmentRange.destroy();
      }

      this.charts.investmentRange = new Chart(investmentRangeCtx, {
        type: 'doughnut',
        data: {
          labels: ['₹25L-1Cr', '₹1Cr-5Cr', '₹5Cr+'],
          datasets: [{
            data: [45, 35, 20],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 4,
            borderColor: '#fff',
            hoverBorderWidth: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2500,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: function(context) {
                  const roiMap = { 0: '45%', 1: '65%', 2: '85%' };
                  return `${context.label}: ${context.parsed}% (Avg ROI: ${roiMap[context.dataIndex]})`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  animateBusinessMatrix() {
    // Animate the occupancy bars
    const occupancyBars = document.querySelectorAll('.occupancy-fill');
    occupancyBars.forEach((bar, index) => {
      setTimeout(() => {
        bar.style.transition = 'width 2s ease-out';
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.width = targetWidth;
        }, 100);
      }, index * 200);
    });

    // Animate score badges
    const scoreBadges = document.querySelectorAll('.score-badge');
    scoreBadges.forEach((badge, index) => {
      setTimeout(() => {
        badge.style.transform = 'scale(1.1)';
        setTimeout(() => {
          badge.style.transform = 'scale(1)';
        }, 300);
      }, index * 300);
    });
  }

  initializeResidentialCharts() {
    // Initialize residential charts with proper timing
    setTimeout(() => {
      this.createResidentialKPICharts();
      this.createPriceTrendChart();
      this.initializeProfileSelector();
    }, 100);
    
    // Create amenities chart with additional delay to ensure canvas is ready
    setTimeout(() => {
      this.createAmenitiesImpactChart();
    }, 500);
  }

  createResidentialKPICharts() {
    // Price Growth Chart
    const priceCtx = document.getElementById('priceGrowthChart');
    if (priceCtx) {
      new Chart(priceCtx, {
        type: 'line',
        data: {
          labels: ['2021', '2022', '2023', '2024'],
          datasets: [{
            label: 'Price Growth',
            data: [7800, 8200, 8900, 9200],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Yield Chart
    const yieldCtx = document.getElementById('yieldChart');
    if (yieldCtx) {
      new Chart(yieldCtx, {
        type: 'doughnut',
        data: {
          labels: ['Current Yield', 'Potential'],
          datasets: [{
            data: [4.5, 1.5],
            backgroundColor: ['#3b82f6', '#e5e7eb'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Supply Growth Chart
    const supplyCtx = document.getElementById('supplyGrowthChart');
    if (supplyCtx) {
      new Chart(supplyCtx, {
        type: 'bar',
        data: {
          labels: ['2022', '2023', '2024'],
          datasets: [{
            data: [12000, 15200, 18500],
            backgroundColor: ['#f59e0b', '#f59e0b', '#f59e0b'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // Absorption Chart
    const absorptionCtx = document.getElementById('absorptionChart');
    if (absorptionCtx) {
      new Chart(absorptionCtx, {
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            data: [190, 180, 170, 165],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  }

  createAmenitiesImpactChart() {
    const ctx = document.getElementById('amenitiesImpactChart');
    if (!ctx) {
      console.log('Amenities chart canvas not found');
      return;
    }

    // Check if canvas is visible and has dimensions
    const rect = ctx.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('Canvas has no dimensions, retrying...');
      setTimeout(() => this.createAmenitiesImpactChart(), 500);
      return;
    }

    // Destroy existing chart if it exists
    if (this.charts.amenitiesChart) {
      this.charts.amenitiesChart.destroy();
    }

    console.log('Creating amenities chart with dimensions:', rect.width, 'x', rect.height);

    this.charts.amenitiesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Schools\n(500m)', 'Metro\n(1km)', 'Hospitals\n(1km)', 'Malls\n(2km)', 'Parks\n(500m)', 'IT Hubs\n(5km)'],
        datasets: [{
          label: 'Property Premium (%)',
          data: [25, 35, 15, 12, 8, 20],
          backgroundColor: [
            '#10b981', '#3b82f6', '#ef4444', 
            '#f59e0b', '#22c55e', '#8b5cf6'
          ],
          borderRadius: 8,
          borderSkipped: false,
          borderWidth: 2,
          borderColor: [
            '#059669', '#1d4ed8', '#dc2626', 
            '#d97706', '#16a34a', '#7c3aed'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              font: { size: 14, weight: 'bold' },
              color: '#374151'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#4f46e5',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `Premium: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 40,
            ticks: {
              font: { size: 12, weight: '500' },
              color: '#6b7280',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.2)'
            }
          },
          x: {
            ticks: {
              font: { size: 11, weight: '500' },
              color: '#374151',
              maxRotation: 0
            },
            grid: {
              display: false
            }
          }
        }
      }
    });

    console.log('Amenities chart created successfully');
  }

  createPriceTrendChart() {
    // This can be used for additional price trend analysis
    const ctx = document.getElementById('priceTrendChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Average Price/sqft',
          data: [8900, 9050, 9100, 9150, 9180, 9200],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  initializeProfileSelector() {
    // Initialize profile selector functionality
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const profile = e.target.closest('.profile-tab').dataset.profile;
        this.switchProfile(profile);
      });
    });

    // Load default profile
    this.switchProfile('first-time');
  }

  switchProfile(profileType) {
    // Update active tab
    document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-profile="${profileType}"]`).classList.add('active');
    
    // Update content
    this.renderProfileContent(profileType);
  }

  renderProfileContent(profileType) {
    const container = document.getElementById('profileContent');
    if (!container) return;

    const profiles = {
      'first-time': {
        title: 'First-time Home Buyer',
        icon: 'fas fa-user-plus',
        description: 'Perfect starter homes with good appreciation potential',
        budget: '₹50L - ₹1.2Cr',
        recommendations: [
          'Focus on 2BHK apartments in emerging areas',
          'Look for properties near metro stations',
          'Consider areas with good school infrastructure',
          'Prioritize ready-to-move properties'
        ],
        areas: ['HSR Layout', 'JP Nagar', 'Banashankari'],
        tips: [
          'Get pre-approved home loan',
          'Check RERA registration',
          'Verify clear title documents',
          'Factor in registration costs (8-10%)'
        ]
      },
      'investor': {
        title: 'Seasoned Real Estate Investor',
        icon: 'fas fa-chart-line',
        description: 'High-yield opportunities with strong rental potential',
        budget: '₹1Cr - ₹5Cr+',
        recommendations: [
          'Target high-rental-yield areas (5%+)',
          'Consider commercial-residential mixed use',
          'Look for pre-launch projects with discounts',
          'Focus on areas with infrastructure development'
        ],
        areas: ['Sarjapur Road', 'Whitefield', 'Electronic City'],
        tips: [
          'Diversify across multiple properties',
          'Track rental yield vs fixed deposits',
          'Consider tax benefits under Section 80C',
          'Monitor market cycles for entry/exit'
        ]
      },
      'family': {
        title: 'Family Upgrade',
        icon: 'fas fa-home',
        description: 'Spacious homes in family-friendly neighborhoods',
        budget: '₹1.5Cr - ₹3Cr',
        recommendations: [
          'Prioritize 3BHK+ with good ventilation',
          'Ensure proximity to quality schools',
          'Look for gated communities with amenities',
          'Consider future expansion possibilities'
        ],
        areas: ['Indiranagar', 'Koramangala', 'HSR Layout'],
        tips: [
          'Visit during different times of day',
          'Check water supply and power backup',
          'Verify parking and security arrangements',
          'Consider resale value for future moves'
        ]
      },
      'nri': {
        title: 'NRI Investment',
        icon: 'fas fa-globe',
        description: 'Hassle-free investment with professional management',
        budget: '₹80L - ₹2.5Cr',
        recommendations: [
          'Choose reputed builders with track record',
          'Opt for managed rental services',
          'Consider areas with high NRI population',
          'Ensure easy repatriation of funds'
        ],
        areas: ['Whitefield', 'HSR Layout', 'Koramangala'],
        tips: [
          'Use Power of Attorney for transactions',
          'Open NRE/NRO accounts for transactions',
          'Understand FEMA compliance requirements',
          'Consider property management services'
        ]
      }
    };

    const profile = profiles[profileType];
    
    container.innerHTML = `
      <div class="profile-details">
        <div class="profile-header">
          <i class="${profile.icon}"></i>
          <div>
            <h3>${profile.title}</h3>
            <p>${profile.description}</p>
          </div>
        </div>
        
        <div class="profile-budget">
          <h4><i class="fas fa-rupee-sign"></i> Typical Budget Range</h4>
          <span class="budget-range">${profile.budget}</span>
        </div>

        <div class="profile-section">
          <h4><i class="fas fa-lightbulb"></i> Key Recommendations</h4>
          <ul class="recommendations-list">
            ${profile.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="profile-section">
          <h4><i class="fas fa-map-marker-alt"></i> Recommended Areas</h4>
          <div class="area-tags">
            ${profile.areas.map(area => `<span class="area-tag">${area}</span>`).join('')}
          </div>
        </div>

        <div class="profile-section">
          <h4><i class="fas fa-info-circle"></i> Pro Tips</h4>
          <ul class="tips-list">
            ${profile.tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  initializeLocationCharts() {
    // Initialize location-specific charts
    setTimeout(() => {
      this.createDemographicsChart();
    }, 100);
  }

  createSectorChart(canvasId, label, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [{
          label: label,
          data: data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  createDemographicsChart() {
    const canvas = document.getElementById('demographicsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['25-35 years', '35-45 years', '45-55 years', '55+ years'],
        datasets: [{
          data: [40, 30, 20, 10],
          backgroundColor: ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 10 } }
          }
        }
      }
    });
  }

  createStudentHousingChart() {
    const canvas = document.getElementById('studentHousingChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2022', '2023', '2024', '2025E'],
        datasets: [{
          label: 'Demand (000s)',
          data: [45, 52, 58, 65],
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  createMetroProximityChart() {
    const canvas = document.getElementById('metroProximityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0-200m', '200-500m', '500m-1km', '1-2km', '2km+'],
        datasets: [{
          label: 'Property Premium (%)',
          data: [40, 25, 15, 8, 0],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              font: { size: 10 },
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LandRefereeDashboard();
});