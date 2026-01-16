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
import { Bar, Doughnut } from 'react-chartjs-2';
import { useJourneyMetrics } from '../hooks/useApi';

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

interface UserJourneyDashboardProps {
  compact?: boolean;
}

function UserJourneyDashboard({ compact = false }: UserJourneyDashboardProps) {
  const { data: metrics, loading, error } = useJourneyMetrics();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading user journey data...</p>
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

  // Time per Activity Bar Chart
  const timePerActivityData = {
    labels: metrics.timePerActivity.slice(0, 6).map((a) => a.activity),
    datasets: [
      {
        label: 'Avg Duration (seconds)',
        data: metrics.timePerActivity.slice(0, 6).map((a) => a.avgDuration),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Drop-off Points Chart
  const dropOffData = {
    labels: metrics.dropOffPoints.slice(0, 5).map((d) => d.page.replace('/', '') || 'home'),
    datasets: [
      {
        label: 'Drop-off Count',
        data: metrics.dropOffPoints.slice(0, 5).map((d) => d.dropOffCount),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  };

  // Activity Breakdown Doughnut
  const activityBreakdownData = {
    labels: metrics.activityBreakdown.slice(0, 5).map((a) => a.activity),
    datasets: [
      {
        data: metrics.activityBreakdown.slice(0, 5).map((a) => a.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(110, 231, 183, 0.8)',
          'rgba(167, 243, 208, 0.8)',
          'rgba(209, 250, 229, 0.8)',
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
        <h2>Customer Journey</h2>
        <p className="dashboard-subtitle">
          How shoppers navigate through GreenLeaf's sustainable marketplace
        </p>
      </div>

      {/* Metric Cards */}
      <div className="metric-cards">
        <div className="metric-card">
          <div className="metric-icon sessions">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.totalSessions.toLocaleString()}</span>
            <span className="metric-label">Active Shoppers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon duration">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatDuration(metrics.avgSessionDuration)}</span>
            <span className="metric-label">Avg Browse Time</span>
          </div>
        </div>

        <div className={`metric-card ${metrics.churnRate > 20 ? 'warning' : ''}`}>
          <div className="metric-icon churn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.churnRate}%</span>
            <span className="metric-label">Lost Customers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon dropoff">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
              />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.dropOffPoints.length}</span>
            <span className="metric-label">Exit Points</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={`charts-grid ${compact ? 'compact-grid' : ''}`}>
        <div className="chart-card">
          <h3>Time Spent by Activity</h3>
          <div className="chart-container">
            <Bar data={timePerActivityData} options={chartOptions} />
          </div>
        </div>

        {!compact && (
          <div className="chart-card">
            <h3>Where Customers Leave</h3>
            <div className="chart-container">
              <Bar
                data={dropOffData}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            </div>
          </div>
        )}

        <div className="chart-card">
          <h3>Shopping Behavior</h3>
          <div className="chart-container doughnut">
            <Doughnut data={activityBreakdownData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {!compact && recommendations.length > 0 && (
        <div className="recommendations-card">
          <div className="recommendations-header">
            <div className="recommendations-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3>What You Can Do</h3>
              <p className="recommendations-subtitle">Based on your customer journey data</p>
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

      {/* Drop-off Table (only in full view) */}
      {!compact && (
        <div className="data-table-card">
          <h3>Exit Point Analysis</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Exits</th>
                <th>Exit Rate</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {metrics.dropOffPoints.slice(0, 5).map((point, i) => (
                <tr key={i}>
                  <td className="page-cell">{point.page || '/home'}</td>
                  <td>{point.dropOffCount}</td>
                  <td>{point.dropOffRate}%</td>
                  <td>
                    <span
                      className={`status-badge ${
                        point.dropOffRate > 20
                          ? 'critical'
                          : point.dropOffRate > 10
                          ? 'warning'
                          : 'good'
                      }`}
                    >
                      {point.dropOffRate > 20
                        ? 'Fix Now'
                        : point.dropOffRate > 10
                        ? 'Monitor'
                        : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function generateRecommendations(metrics: any): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check churn rate
  if (metrics.churnRate > 25) {
    recommendations.push({
      priority: 'high',
      title: 'Re-engage inactive customers',
      description: `${metrics.churnRate}% of customers haven't returned. Send personalized "We miss you" emails with a 15% discount on their favorite eco-categories.`,
    });
  } else if (metrics.churnRate > 15) {
    recommendations.push({
      priority: 'medium',
      title: 'Improve retention with loyalty perks',
      description: 'Start a "Green Points" program where repeat purchases earn credits toward carbon offsets or free products.',
    });
  }

  // Check session duration
  if (metrics.avgSessionDuration < 300) {
    recommendations.push({
      priority: 'medium',
      title: 'Keep shoppers engaged longer',
      description: 'Add sustainability stories to product pages. Customers who read impact stories spend 40% more time browsing.',
    });
  }

  // Check drop-off points
  const cartDropOff = metrics.dropOffPoints.find((d: any) => d.page === '/cart');
  if (cartDropOff && cartDropOff.dropOffRate > 15) {
    recommendations.push({
      priority: 'high',
      title: 'Reduce cart abandonment',
      description: `${cartDropOff.dropOffRate}% leave at cart. Show shipping threshold ("$12 away from free carbon-neutral shipping") and add express checkout.`,
    });
  }

  const pricingDropOff = metrics.dropOffPoints.find((d: any) => d.page === '/pricing');
  if (pricingDropOff && pricingDropOff.dropOffRate > 10) {
    recommendations.push({
      priority: 'medium',
      title: 'Simplify subscription options',
      description: 'Too many leave at pricing. Test showing just 2 plans instead of 4, with a clear "Most Popular" badge.',
    });
  }

  // If browse time is good, suggest upsells
  if (metrics.avgSessionDuration > 600) {
    recommendations.push({
      priority: 'low',
      title: 'Capitalize on engaged browsers',
      description: 'Your customers browse for a while—add a "Complete the Look" section with sustainable bundles on product pages.',
    });
  }

  return recommendations.slice(0, 3);
}

export default UserJourneyDashboard;
