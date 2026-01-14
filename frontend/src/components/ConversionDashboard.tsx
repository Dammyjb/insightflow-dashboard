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

  // Funnel Chart Data
  const funnelData = {
    labels: metrics.funnelSteps.map((s) => s.step),
    datasets: [
      {
        label: 'Users Entered',
        data: metrics.funnelSteps.map((s) => s.entered),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Users Completed',
        data: metrics.funnelSteps.map((s) => s.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
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
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(99, 102, 241)',
      },
    ],
  };

  // Bounce vs Conversion Doughnut
  const bounceVsConversionData = {
    labels: ['Bounced', 'Engaged', 'Converted'],
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
          'rgba(34, 197, 94, 0.8)',
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
          color: '#64748b',
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#64748b', font: { size: 10 } },
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
        labels: { color: '#64748b', padding: 8, font: { size: 10 } },
      },
    },
    cutout: '65%',
  };

  return (
    <div className={`dashboard ${compact ? 'compact' : ''}`}>
      <div className="dashboard-header">
        <h2>Conversion Rates Dashboard</h2>
        <p className="dashboard-subtitle">
          Track bounce rates, funnel performance, and conversion metrics
        </p>
      </div>

      {/* Metric Cards */}
      <div className="metric-cards">
        <div className="metric-card warning">
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
            <span className="metric-label">Bounce Rate</span>
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
            <span className="metric-label">Conversion Rate</span>
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
            <span className="metric-label">Total Revenue</span>
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
            <span className="metric-label">Avg Order Value</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={`charts-grid ${compact ? 'compact-grid' : ''}`}>
        <div className="chart-card wide">
          <h3>Conversion Funnel</h3>
          <div className="chart-container">
            <Bar data={funnelData} options={chartOptions} />
          </div>
        </div>

        {!compact && (
          <div className="chart-card">
            <h3>Daily Conversion Trend</h3>
            <div className="chart-container">
              <Line data={dailyData} options={lineOptions} />
            </div>
          </div>
        )}

        <div className="chart-card">
          <h3>User Engagement</h3>
          <div className="chart-container doughnut">
            <Doughnut data={bounceVsConversionData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Funnel Drop-off Table (only in full view) */}
      {!compact && (
        <div className="data-table-card">
          <h3>Funnel Step Analysis</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Users Entered</th>
                <th>Users Completed</th>
                <th>Drop-off Rate</th>
                <th>Status</th>
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
                  <td>{step.dropOffRate}%</td>
                  <td>
                    <span
                      className={`status-badge ${
                        step.dropOffRate > 30
                          ? 'critical'
                          : step.dropOffRate > 20
                          ? 'warning'
                          : 'good'
                      }`}
                    >
                      {step.dropOffRate > 30
                        ? 'Critical'
                        : step.dropOffRate > 20
                        ? 'Needs Work'
                        : 'Healthy'}
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
          <h3>Visual Funnel</h3>
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

export default ConversionDashboard;
