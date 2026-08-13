/* ==========================================================================
   Cars24 ML Valuation Platform - Client Application Script
   ========================================================================== */

let depreciationChartInstance = null;
let currentSelectedBrand = 'Maruti Suzuki';
const API_BASE_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Cars24 ML] App initialized. API Base URL:', API_BASE_URL);
    // Initial prediction run
    runPrediction();
    // Render depreciation chart
    loadChartData();
});

/**
 * Synchronize Year range slider with display label
 */
function syncYearInput(val) {
    document.getElementById('year-display').textContent = val;
    document.getElementById('summary-year').textContent = val;
    // Auto-update request payload in API tester tab
    document.getElementById('request-payload').querySelector('code').textContent = JSON.stringify({ year: parseInt(val) }, null, 2);
}

/**
 * Update Kilometers display label
 */
function updateKmDisplay(val) {
    const formatted = parseInt(val).toLocaleString('en-IN');
    document.getElementById('km-display').textContent = `${formatted} km`;
}

/**
 * Select Brand chip handler
 */
function selectBrand(chipElement, brandName) {
    document.querySelectorAll('.brand-chip').forEach(chip => chip.classList.remove('active'));
    chipElement.classList.add('active');
    currentSelectedBrand = brandName;
    document.getElementById('summary-brand').textContent = brandName;
}

/**
 * Main ML Prediction Trigger
 */
async function runPrediction() {
    const year = parseInt(document.getElementById('year-slider').value);
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const predictBtn = document.getElementById('predict-btn');

    // UI Loading state
    btnText.style.opacity = '0.5';
    btnSpinner.classList.remove('hidden');
    predictBtn.disabled = true;

    const startTime = performance.now();

    try {
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: year })
        });

        const latency = Math.round(performance.now() - startTime);
        const data = await response.json();

        if (response.ok && data.success) {
            // Update Valuation Output Card with animated values
            animateCounter('resale-price', data.formatted_price_inr);
            document.getElementById('resale-lakhs').textContent = data.formatted_lakhs;
            document.getElementById('range-min').textContent = data.valuation_range.formatted_min;
            document.getElementById('range-max').textContent = data.valuation_range.formatted_max;
            document.getElementById('summary-latency').textContent = `${latency} ms`;

            // Update API Tester Tab Response
            document.getElementById('api-status-code').textContent = '200 OK';
            document.getElementById('api-status-code').className = 'status-200';
            document.getElementById('api-time').textContent = `${latency} ms`;
            document.getElementById('response-payload').querySelector('code').textContent = JSON.stringify(data, null, 2);

            // Highlight selected point on Chart
            if (depreciationChartInstance) {
                highlightChartPoint(year);
            }
        } else {
            showToast(data.error || 'Failed to calculate prediction', 'danger');
            document.getElementById('api-status-code').textContent = `${response.status} Error`;
            document.getElementById('api-status-code').className = 'text-danger';
            document.getElementById('response-payload').querySelector('code').textContent = JSON.stringify(data, null, 2);
        }

    } catch (err) {
        console.error('[API Error]', err);
        showToast('Network error: Unable to reach backend API', 'danger');
    } finally {
        btnText.style.opacity = '1';
        btnSpinner.classList.add('hidden');
        predictBtn.disabled = false;
    }
}

/**
 * Fetch yearly range data and initialize Chart.js
 */
async function loadChartData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/predict_range?start=2010&end=2026`);
        const result = await response.json();

        if (!response.ok || !result.success) return;

        const labels = result.data.map(item => item.year);
        const pricesLakhs = result.data.map(item => (item.price / 100000).toFixed(2));

        const ctx = document.getElementById('depreciationChart').getContext('2d');

        if (depreciationChartInstance) {
            depreciationChartInstance.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 350);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        depreciationChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valuation (in ₹ Lakhs)',
                    data: pricesLakhs,
                    borderColor: '#3B82F6',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#06B6D4',
                    pointBorderColor: '#FFF',
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9CA3AF', font: { family: 'Inter', size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Valuation: ₹ ${context.raw} Lakhs`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#9CA3AF',
                            callback: function(val) { return `₹ ${val} L`; }
                        }
                    }
                }
            }
        });

    } catch (e) {
        console.error('Failed to load chart data:', e);
    }
}

/**
 * Highlight active selected year on chart
 */
function highlightChartPoint(targetYear) {
    if (!depreciationChartInstance) return;
    const index = depreciationChartInstance.data.labels.indexOf(targetYear);
    if (index !== -1) {
        const radii = depreciationChartInstance.data.labels.map((_, i) => i === index ? 9 : 5);
        const colors = depreciationChartInstance.data.labels.map((_, i) => i === index ? '#10B981' : '#06B6D4');
        depreciationChartInstance.data.datasets[0].pointRadius = radii;
        depreciationChartInstance.data.datasets[0].pointBackgroundColor = colors;
        depreciationChartInstance.update();
    }
}

/**
 * Smooth transition update for result text
 */
function animateCounter(elementId, targetFormattedText) {
    const el = document.getElementById(elementId);
    el.style.opacity = '0';
    setTimeout(() => {
        el.textContent = targetFormattedText;
        el.style.opacity = '1';
    }, 150);
}

/**
 * Execute API Test manually from API Tester tab
 */
function executeApiTest() {
    runPrediction();
    showToast('API request dispatched to /api/predict', 'info');
}

/**
 * Copy valuation quote to clipboard
 */
function copyQuote() {
    const price = document.getElementById('resale-price').textContent;
    const lakhs = document.getElementById('resale-lakhs').textContent;
    const year = document.getElementById('summary-year').textContent;
    const brand = document.getElementById('summary-brand').textContent;

    const text = `🚗 Cars24 AI Car Valuation Quote\n• Vehicle: ${brand} (${year})\n• Estimated Value: ${price} (${lakhs})\n• Generated via Cars24 Scikit-Learn ML Model`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Quote copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy quote', 'danger');
    });
}

/**
 * Copy code snippet from element
 */
function copyCode(elementId) {
    const codeText = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        showToast('Copied payload to clipboard', 'info');
    });
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
