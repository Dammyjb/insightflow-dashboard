import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useConversionMetrics } from '../hooks/useApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConversionDashboardProps {
  compact?: boolean;
}

function ConversionDashboard({ compact = false }: ConversionDashboardProps) {
  const { data: metrics, loading, error } = useConversionMetrics();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading conversion data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  // Generate recommendations based on actual metrics
  const recommendations = generateRecommendations(metrics);

  // Funnel Chart Data
  const funnelData = {
    labels: metrics.funnelSteps.map((s) => s.step),
    datasets: [
      {
        label: 'Visitors',
        data: metrics.funnelSteps.map((s) => s.entered),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Completed',
        data: metrics.funnelSteps.map((s) => s.completed),
        backgroundColor: 'rgba(52, 211, 153, 0.8)',
        borderColor: 'rgb(52, 211, 153)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Daily Conversion Trend
  const dailyData = {
    labels: metrics.dailyConversions
      .slice(0, 14)
      .reverse()
      .map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Conversion Rate %',
        data: metrics.dailyConversions
          .slice(0, 14)
          .reverse()
          .map((d) => d.rate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  // Bounce vs Conversion Doughnut
  const bounceVsConversionData = {
    labels: ['Left Early', 'Browsed Only', 'Purchased'],
    datasets: [
      {
        data: [
          metrics.bounceRate,
          100 - metrics.bounceRate - metrics.overallConversionRate,
          metrics.overallConversionRate,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        position: 'bottom' as const,
        labels: {
          color: '#71717a',
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(113, 113, 122, 0.1)' },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        position: 'right' as const,
        labels: { color: '#71717a', padding: 8, font: { size: 10 } },
      },
    },
    cutout: '65%',
  };

  return (
    <div className={`dashboard ${compact ? 'compact' : ''}`}>
      <div className="dashboard-header">
        <h2>Sales Performance</h2>
        <p className="dashboard-subtitle">
          From first visit to purchase—how GreenLeaf converts eco-conscious shoppers
        </p>
      </div>

      {/* Metric Cards */}
      <div className="metric-cards">
        <div className={`metric-card ${metrics.bounceRate > 30 ? 'warning' : ''}`}>
          <div className="metric-icon bounce">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.bounceRate}%</span>
            <span className="metric-label">Quick Exits</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon conversion">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.overallConversionRate}%</span>
            <span className="metric-label">Buyers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">
              ${metrics.revenueMetrics.totalRevenue.toLocaleString()}
            </span>
            <span className="metric-label">Revenue</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon aov">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">
              ${metrics.revenueMetrics.avgOrderValue}
            </span>
            <span className="metric-label">Avg Order</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={`charts-grid ${compact ? 'compact-grid' : ''}`}>
        <div className="chart-card wide">
          <h3>Purchase Funnel</h3>
          <div className="chart-container">
            <Bar data={funnelData} options={chartOptions} />
          </div>
        </div>

        {!compact && (
          <div className="chart-card">
            <h3>Conversion Trend (14 days)</h3>
            <div className="chart-container">
              <Line data={dailyData} options={lineOptions} />
            </div>
          </div>
        )}

        <div className="chart-card">
          <h3>Visitor Outcomes</h3>
          <div className="chart-container doughnut">
            <Doughnut data={bounceVsConversionData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {!compact && recommendations.length > 0 && (
        <div className="recommendations-card">
          <div className="recommendations-header">
            <div className="recommendations-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3>Growth Opportunities</h3>
              <p className="recommendations-subtitle">Actions to boost your conversion rate</p>
            </div>
          </div>
          <div className="recommendations-list">
            {recommendations.map((rec, i) => (
              <div key={i} className={`recommendation-item ${rec.priority}`}>
                <div className="recommendation-priority">{rec.priority}</div>
                <div className="recommendation-content">
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel Drop-off Table (only in full view) */}
      {!compact && (
        <div className="data-table-card">
          <h3>Funnel Breakdown</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Entered</th>
                <th>Completed</th>
                <th>Lost</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {metrics.funnelSteps.map((step, i) => (
                <tr key={i}>
                  <td className="step-cell">
                    <span className="step-number">{step.stepOrder}</span>
                    {step.step}
                  </td>
                  <td>{step.entered.toLocaleString()}</td>
                  <td>{step.completed.toLocaleString()}</td>
                  <td className="text-danger">-{step.dropOffRate}%</td>
                  <td>
                    <span
                      className={`status-badge ${
                        step.dropOffRate > 35
                          ? 'critical'
                          : step.dropOffRate > 25
                          ? 'warning'
                          : 'good'
                      }`}
                    >
                      {step.dropOffRate > 35
                        ? 'Leaking'
                        : step.dropOffRate > 25
                        ? 'Okay'
                        : 'Strong'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Funnel Visualization */}
      {!compact && (
        <div className="funnel-visual-card">
          <h3>Conversion Flow</h3>
          <div className="funnel-visual">
            {metrics.funnelSteps.map((step, i) => {
              const widthPercent = (step.entered / metrics.funnelSteps[0].entered) * 100;
              return (
                <div key={i} className="funnel-step-visual">
                  <div
                    className="funnel-bar"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="funnel-step-name">{step.step}</span>
                    <span className="funnel-step-count">
                      {step.entered.toLocaleString()}
                    </span>
                  </div>
                  {i < metrics.funnelSteps.length - 1 && (
                    <div className="funnel-dropoff">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 12l-4-4h8l-4 4z" />
                      </svg>
                      <span>-{step.dropOffRate}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function generateRecommendations(metrics: any): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check bounce rate
  if (metrics.bounceRate > 35) {
    recommendations.push({
      priority: 'high',
      title: 'Fix your landing page',
      description: `${metrics.bounceRate}% leave immediately. Test a hero image showing product impact (e.g., "This order plants 3 trees") instead of generic product shots.`,
    });
  } else if (metrics.bounceRate > 20) {
    recommendations.push({
      priority: 'medium',
      title: 'Speed up page load',
      description: 'Compress images and lazy-load below-fold content. Every 1 second of load time costs you 7% conversions.',
    });
  }

  // Check funnel steps
  const checkoutStep = metrics.funnelSteps.find((s: any) => s.step === 'Begin Checkout');
  if (checkoutStep && checkoutStep.dropOffRate > 35) {
    recommendations.push({
      priority: 'high',
      title: 'Simplify checkout',
      description: `${checkoutStep.dropOffRate}% abandon at checkout. Add guest checkout, show trust badges, and display "Free returns on all eco-products."`,
    });
  }

  const cartStep = metrics.funnelSteps.find((s: any) => s.step === 'Add to Cart');
  if (cartStep && cartStep.dropOffRate > 30) {
    recommendations.push({
      priority: 'high',
      title: 'Make "Add to Cart" irresistible',
      description: 'Show low-stock alerts and carbon savings on product pages. "Only 3 left" and "Saves 2kg of CO2" create urgency.',
    });
  }

  // Check AOV
  if (metrics.revenueMetrics.avgOrderValue < 50) {
    recommendations.push({
      priority: 'medium',
      title: 'Increase order value',
      description: `Average order is $${metrics.revenueMetrics.avgOrderValue}. Add a "Frequently bought together" bundle at 10% off to boost cart size.`,
    });
  }

  // Check overall conversion
  if (metrics.overallConversionRate < 3) {
    recommendations.push({
      priority: 'high',
      title: 'Recover lost sales',
      description: 'Set up abandoned cart emails with a 10% "Come back" discount. Include the exact items they left behind.',
    });
  } else if (metrics.overallConversionRate > 5) {
    recommendations.push({
      priority: 'low',
      title: "You're doing well—now experiment",
      description: 'Strong conversion rate. A/B test premium upsells like "Carbon neutral shipping (+$2)" to grow revenue per customer.',
    });
  }

  return recommendations.slice(0, 3);
}

export default ConversionDashboard;
