/* ============================================================
   INTELLICARD AI — DASHBOARD VISUALS (CHART.JS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderActivityChart();
});

/**
 * Renders a glowing gradient bar chart of study counts per day
 */
function renderActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;

  // Fallbacks if data variables are missing
  const labels = typeof activityLabels !== 'undefined' ? activityLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = typeof activityCounts !== 'undefined' ? activityCounts : [0, 0, 0, 0, 0, 0, 0];

  // Set up neon color gradients
  const chartCtx = ctx.getContext('2d');
  const gradient = chartCtx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.45)'); // Cyan neon glow
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)'); // Purple accent
  gradient.addColorStop(1, 'rgba(2, 8, 23, 0.05)'); // Dark background

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cards Studied',
        data: counts,
        backgroundColor: gradient,
        borderColor: '#00d4ff', // var(--cyan)
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00d4ff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35 // smooth curved lines
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1526', // var(--card)
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Studied: ${context.parsed.y} cards`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b', // var(--muted)
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.035)', // very faint horizontal lines
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: { family: 'Inter', size: 11 },
            stepSize: 1,
            precision: 0
          },
          min: 0
        }
      }
    }
  });
}
