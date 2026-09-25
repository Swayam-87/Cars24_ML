/* ==========================================================================
   Cars24 ML Valuation Platform - Client Application Script (v2.0)
   ========================================================================== */

let depreciationChartInstance = null;
let currentSelectedBrand = 'Maruti';
const API_BASE_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Cars24 ML v2.0] Initialized with Decision Tree engine. API:', API_BASE_URL);
    // Fetch model info and accuracy metrics
    fetchModelMetadata();
    // Initial prediction run
    runPrediction();
    // Render initial depreciation chart
    loadChartData();
});

/**
 * Fetch Decision Tree Model Metadata and Accuracy Scores
 */
async function fetchModelMetadata() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/model_info`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
            const acc = data.accuracy_score;
            // Update hero accuracy text
            const heroAcc = document.getElementById('hero-accuracy-text');
            if (heroAcc) heroAcc.innerHTML = `Model Accuracy Score: <strong>${acc}%</strong> (R²)`;
            
            // Update stats bar
            const statsVal = document.getElementById('stats-acc-value');
            if (statsVal) statsVal.textContent = `${acc}%`;

            // Update result card badge
            const cardBadge = document.getElementById('card-acc-badge');
            if (cardBadge) cardBadge.textContent = `Accuracy: ${acc}% (R²)`;

            // Update summary
            const summaryAcc = document.getElementById('summary-acc');
            if (summaryAcc) summaryAcc.textContent = `${acc}% (R² Score)`;

            // Update metric cards
            const mR2 = document.getElementById('metric-r2-val');
            if (mR2) mR2.textContent = `${acc}%`;

            const mTest = document.getElementById('metric-test-val');
            if (mTest && data.test_r2) mTest.textContent = `${data.test_r2}%`;

            const mMae = document.getElementById('metric-mae-val');
            if (mMae && data.mae) mMae.textContent = `₹ ${(data.mae / 100000).toFixed(2)} L`;

            const mSamples = document.getElementById('metric-samples-val');
            if (mSamples && data.sample_count) mSamples.textContent = `${data.sample_count}`;
        }
    } catch (e) {
        console.warn('Could not fetch model metadata:', e);
    }
}

/**
 * Synchronize Year range slider with display label
 */
function syncYearInput(val) {
    document.getElementById('year-display').textContent = val;
    document.getElementById('summary-year').textContent = val;
    updateApiPayloadPreview();
    runPrediction();
}

/**
 * Update Kilometers display label
 */
function updateKmDisplay(val) {
    const formatted = parseInt(val).toLocaleString('en-IN');
    document.getElementById('km-display').textContent = `${formatted} km`;
    document.getElementById('summary-km').textContent = `${formatted} km`;
    updateApiPayloadPreview();
    runPrediction();
}

/**
 * Select Brand chip handler
 */
function selectBrand(chipElement, brandName) {
    document.querySelectorAll('.brand-chip').forEach(chip => chip.classList.remove('active'));
    chipElement.classList.add('active');
    currentSelectedBrand = brandName;
    document.getElementById('brand-display').textContent = brandName;
    document.getElementById('summary-brand').textContent = brandName;
    document.getElementById('chart-brand-label').textContent = brandName;
    
    // Reset dropdown
    const brandSelect = document.getElementById('brand-select');
    if (brandSelect) brandSelect.value = '';

    updateApiPayloadPreview();
    runPrediction();
    loadChartData();
}

/**
 * Brand Dropdown change handler
 */
function onBrandDropdownChange(brandName) {
    if (!brandName) return;
    document.querySelectorAll('.brand-chip').forEach(chip => {
        if (chip.textContent.trim().toLowerCase() === brandName.toLowerCase()) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    currentSelectedBrand = brandName;
    document.getElementById('brand-display').textContent = brandName;
    document.getElementById('summary-brand').textContent = brandName;
    document.getElementById('chart-brand-label').textContent = brandName;
    updateApiPayloadPreview();
    runPrediction();
    loadChartData();
}

/**
 * Collect current form payload
 */
function getFormPayload() {
    const year = parseInt(document.getElementById('year-slider').value);
    const km_driven = parseInt(document.getElementById('km-slider').value);
    const fuel = document.getElementById('fuel-select').value;
    const transmission = document.getElementById('trans-select').value;
    const seller_type = document.getElementById('seller-select').value;
    const owner = document.getElementById('owner-select').value;

    return {
        brand: currentSelectedBrand,
        year: year,
        km_driven: km_driven,
        fuel: fuel,
        seller_type: seller_type,
        transmission: transmission,
        owner: owner
    };
}

/**
 * Update request payload in API tester tab
 */
function updateApiPayloadPreview() {
    const payload = getFormPayload();
    const reqPayloadEl = document.getElementById('request-payload');
    if (reqPayloadEl) {
        reqPayloadEl.querySelector('code').textContent = JSON.stringify(payload, null, 2);
    }
}

/**
 * Main Decision Tree ML Prediction Trigger
 */
async function runPrediction() {
    const payload = getFormPayload();
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const predictBtn = document.getElementById('predict-btn');

    // UI Loading state
    if (btnText) btnText.style.opacity = '0.5';
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    if (predictBtn) predictBtn.disabled = true;

    // Update summary preview
    document.getElementById('summary-fuel').textContent = payload.fuel;
    document.getElementById('summary-trans').textContent = payload.transmission;
    document.getElementById('summary-seller').textContent = payload.seller_type;
    document.getElementById('summary-owner').textContent = payload.owner;

    const startTime = performance.now();

    try {
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

            if (data.model_metadata && data.model_metadata.accuracy_score) {
                const accStr = data.model_metadata.accuracy_score;
                const cardBadge = document.getElementById('card-acc-badge');
                if (cardBadge) cardBadge.textContent = `Accuracy: ${accStr} (R²)`;
                const summaryAcc = document.getElementById('summary-acc');
                if (summaryAcc) summaryAcc.textContent = `${accStr} (R² Score)`;
            }

            // Update API Tester Tab Response
            const statusCode = document.getElementById('api-status-code');
            if (statusCode) {
                statusCode.textContent = '200 OK';
                statusCode.className = 'status-200';
            }
            const timeBadge = document.getElementById('api-time');
            if (timeBadge) timeBadge.textContent = `${latency} ms`;

            const respPayloadEl = document.getElementById('response-payload');
            if (respPayloadEl) {
                respPayloadEl.querySelector('code').textContent = JSON.stringify(data, null, 2);
            }

            // Highlight selected point on Chart
            if (depreciationChartInstance) {
                highlightChartPoint(payload.year);
            }
        } else {
            showToast(data.error || 'Failed to calculate prediction', 'danger');
            const statusCode = document.getElementById('api-status-code');
            if (statusCode) {
                statusCode.textContent = `${response.status} Error`;
                statusCode.className = 'text-danger';
            }
            const respPayloadEl = document.getElementById('response-payload');
            if (respPayloadEl) {
                respPayloadEl.querySelector('code').textContent = JSON.stringify(data, null, 2);
            }
        }

    } catch (err) {
        console.error('[API Error]', err);
        showToast('Network error: Unable to reach backend API', 'danger');
    } finally {
        if (btnText) btnText.style.opacity = '1';
        if (btnSpinner) btnSpinner.classList.add('hidden');
        if (predictBtn) predictBtn.disabled = false;
    }
}

/**
 * Fetch yearly range data and initialize Chart.js for selected brand
 */
async function loadChartData() {
    try {
        const payload = getFormPayload();
        const url = `${API_BASE_URL}/api/predict_range?start=2010&end=2026&brand=${encodeURIComponent(payload.brand)}&fuel=${encodeURIComponent(payload.fuel)}&transmission=${encodeURIComponent(payload.transmission)}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.success) return;

        const labels = result.data.map(item => item.year);
        const pricesLakhs = result.data.map(item => (item.price / 100000).toFixed(2));

        const canvas = document.getElementById('depreciationChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

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
                    label: `${result.brand || currentSelectedBrand} Valuation (in ₹ Lakhs)`,
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

        highlightChartPoint(payload.year);

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
    if (!el) return;
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
    showToast('Dispatched request to /api/predict', 'info');
}

/**
 * Copy valuation quote to clipboard
 */
function copyQuote() {
    const price = document.getElementById('resale-price').textContent;
    const lakhs = document.getElementById('resale-lakhs').textContent;
    const year = document.getElementById('summary-year').textContent;
    const brand = document.getElementById('summary-brand').textContent;
    const km = document.getElementById('summary-km').textContent;
    const trans = document.getElementById('summary-trans').textContent;
    const fuel = document.getElementById('summary-fuel').textContent;
    const acc = document.getElementById('summary-acc').textContent;

    const text = `🚗 Cars24 AI Valuation Quote (Decision Tree Model)\n• Vehicle: ${brand} (${year})\n• Specs: ${fuel} | ${trans} | ${km}\n• Estimated Value: ${price} (${lakhs})\n• Model Accuracy: ${acc}\n• Powered by Cars24 ML Decision Tree Engine`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Valuation quote copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy quote', 'danger');
    });
}

/**
 * Copy code snippet from element
 */
function copyCode(elementId) {
    const codeEl = document.getElementById(elementId);
    if (!codeEl) return;
    const codeText = codeEl.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        showToast('Copied payload to clipboard', 'info');
    });
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
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
