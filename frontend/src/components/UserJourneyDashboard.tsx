import { useEffect, useState } from 'react';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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

  // Time per Activity Bar Chart
  const timePerActivityData = {
    labels: metrics.timePerActivity.slice(0, 6).map((a) => a.activity),
    datasets: [
      {
        label: 'Avg Duration (seconds)',
        data: metrics.timePerActivity.slice(0, 6).map((a) => a.avgDuration),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Drop-off Points Chart
  const dropOffData = {
    labels: metrics.dropOffPoints.slice(0, 5).map((d) => d.page.replace('/', '')),
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
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(217, 70, 239, 0.8)',
          'rgba(236, 72, 153, 0.8)',
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
        <h2>User Journey Dashboard</h2>
        <p className="dashboard-subtitle">
          Track user interactions, engagement time, and drop-off points
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
            <span className="metric-label">Total Sessions</span>
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
            <span className="metric-label">Avg Session</span>
          </div>
        </div>

        <div className="metric-card warning">
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
            <span className="metric-label">Churn Rate</span>
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
            <span className="metric-label">Drop-off Points</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={`charts-grid ${compact ? 'compact-grid' : ''}`}>
        <div className="chart-card">
          <h3>Time per Activity</h3>
          <div className="chart-container">
            <Bar data={timePerActivityData} options={chartOptions} />
          </div>
        </div>

        {!compact && (
          <div className="chart-card">
            <h3>Drop-off Points</h3>
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
          <h3>Activity Breakdown</h3>
          <div className="chart-container doughnut">
            <Doughnut data={activityBreakdownData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Drop-off Table (only in full view) */}
      {!compact && (
        <div className="data-table-card">
          <h3>Top Drop-off Points</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Drop-off Count</th>
                <th>Drop-off Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.dropOffPoints.slice(0, 5).map((point, i) => (
                <tr key={i}>
                  <td className="page-cell">{point.page}</td>
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
                        ? 'Critical'
                        : point.dropOffRate > 10
                        ? 'Needs Attention'
                        : 'Good'}
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

export default UserJourneyDashboard;
