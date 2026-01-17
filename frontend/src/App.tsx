import { useState, useEffect } from 'react';
import UserJourneyDashboard from './components/UserJourneyDashboard';
import ConversionDashboard from './components/ConversionDashboard';
import AIBot from './components/AIBot';
import Header from './components/Header';
import { useJourneyMetrics, useConversionMetrics } from './hooks/useApi';

type DashboardView = 'journey' | 'conversion' | 'synoptic';
type Theme = 'dark' | 'light';

const GLOSSARY_TERMS = [
  {
    term: 'Active Shoppers',
    definition: 'Unique visitors who started a browsing session on the site within the selected time period.',
    category: 'journey',
  },
  {
    term: 'Avg Browse Time',
    definition: 'The average duration a customer spends on the site per session, from landing to exit.',
    category: 'journey',
  },
  {
    term: 'Churn Rate',
    definition: 'Percentage of customers who made a purchase but haven\'t returned within 30 days. Lower is better—aim for under 20%.',
    category: 'journey',
  },
  {
    term: 'Exit Points',
    definition: 'Pages where customers leave the site without completing a purchase. High exit rates indicate friction.',
    category: 'journey',
  },
  {
    term: 'Drop-off Rate',
    definition: 'The percentage of users who leave at a specific step in the funnel without proceeding to the next step.',
    category: 'conversion',
  },
  {
    term: 'Bounce Rate',
    definition: 'Percentage of visitors who leave after viewing only one page. Industry average is 20-40%.',
    category: 'conversion',
  },
  {
    term: 'Conversion Rate',
    definition: 'Percentage of visitors who complete a purchase. Calculated as (purchases ÷ total visitors) × 100.',
    category: 'conversion',
  },
  {
    term: 'Funnel',
    definition: 'The step-by-step path customers take from landing on the site to completing a purchase.',
    category: 'conversion',
  },
  {
    term: 'AOV (Avg Order Value)',
    definition: 'Average amount spent per transaction. Calculated as total revenue ÷ number of orders.',
    category: 'conversion',
  },
  {
    term: 'Revenue',
    definition: 'Total income from completed purchases within the selected time period.',
    category: 'conversion',
  },
];

function App() {
  const [activeView, setActiveView] = useState<DashboardView>('synoptic');
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [glossaryExpanded, setGlossaryExpanded] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('insightflow-theme');
    return (saved as Theme) || 'dark';
  });

  // Fetch metrics for summary banner
  const { data: journeyMetrics } = useJourneyMetrics();
  const { data: conversionMetrics } = useConversionMetrics();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('insightflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Calculate health score based on metrics
  const getHealthScore = () => {
    if (!journeyMetrics || !conversionMetrics) return null;
    let score = 70; // Base score

    // Good conversion rate adds points
    if (conversionMetrics.overallConversionRate > 10) score += 10;
    if (conversionMetrics.overallConversionRate > 20) score += 5;

    // Low bounce rate adds points
    if (conversionMetrics.bounceRate < 30) score += 5;
    if (conversionMetrics.bounceRate < 20) score += 5;

    // Churn rate affects score
    if (journeyMetrics.churnRate > 25) score -= 10;
    if (journeyMetrics.churnRate < 15) score += 5;

    return Math.min(100, Math.max(0, score));
  };

  const healthScore = getHealthScore();

  return (
    <div className="app">
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="main-content">
        {activeView === 'synoptic' && (
          <>
            {/* Data Summary Banner */}
            {journeyMetrics && conversionMetrics && (
              <div className="summary-banner">
                <div className="summary-header">
                  <div className="summary-title">
                    <h2>Store Performance Overview</h2>
                    <p className="summary-subtitle">Real-time insights for GreenLeaf Marketplace</p>
                  </div>
                  {healthScore !== null && (
                    <div className={`health-score ${healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs-work'}`}>
                      <span className="score-value">{healthScore}</span>
                      <span className="score-label">Health Score</span>
                    </div>
                  )}
                </div>
                <div className="summary-metrics">
                  <div className="summary-metric">
                    <span className="metric-icon blue">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">{journeyMetrics.totalSessions.toLocaleString()}</span>
                      <span className="metric-name">Active Shoppers</span>
                    </div>
                  </div>
                  <div className="summary-metric">
                    <span className="metric-icon green">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">{conversionMetrics.overallConversionRate}%</span>
                      <span className="metric-name">Conversion Rate</span>
                    </div>
                  </div>
                  <div className="summary-metric">
                    <span className="metric-icon purple">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">${conversionMetrics.revenueMetrics.totalRevenue.toLocaleString()}</span>
                      <span className="metric-name">Total Revenue</span>
                    </div>
                  </div>
                  <div className="summary-metric">
                    <span className="metric-icon orange">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">${conversionMetrics.revenueMetrics.avgOrderValue}</span>
                      <span className="metric-name">Avg Order Value</span>
                    </div>
                  </div>
                  <div className={`summary-metric ${journeyMetrics.churnRate > 20 ? 'alert' : ''}`}>
                    <span className={`metric-icon ${journeyMetrics.churnRate > 20 ? 'red' : 'teal'}`}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">{journeyMetrics.churnRate}%</span>
                      <span className="metric-name">Churn Rate</span>
                    </div>
                  </div>
                  <div className="summary-metric">
                    <span className="metric-icon cyan">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div className="metric-data">
                      <span className="metric-number">{Math.floor(journeyMetrics.avgSessionDuration / 60)}m {journeyMetrics.avgSessionDuration % 60}s</span>
                      <span className="metric-name">Avg Session</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="synoptic-view">
              <div className="dashboard-panel">
                <UserJourneyDashboard compact />
              </div>
              <div className="dashboard-panel">
                <ConversionDashboard compact />
              </div>
            </div>

            {/* Terminology Dictionary */}
            <div className="glossary-section">
              <button
                className="glossary-toggle"
                onClick={() => setGlossaryExpanded(!glossaryExpanded)}
              >
                <div className="glossary-toggle-left">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span>Terminology Guide</span>
                  <span className="glossary-count">{GLOSSARY_TERMS.length} terms</span>
                </div>
                <svg
                  className={`glossary-chevron ${glossaryExpanded ? 'expanded' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {glossaryExpanded && (
                <div className="glossary-content">
                  <div className="glossary-grid">
                    <div className="glossary-column">
                      <h4>Customer Journey</h4>
                      {GLOSSARY_TERMS.filter(t => t.category === 'journey').map((item, i) => (
                        <div key={i} className="glossary-item">
                          <dt>{item.term}</dt>
                          <dd>{item.definition}</dd>
                        </div>
                      ))}
                    </div>
                    <div className="glossary-column">
                      <h4>Conversion & Sales</h4>
                      {GLOSSARY_TERMS.filter(t => t.category === 'conversion').map((item, i) => (
                        <div key={i} className="glossary-item">
                          <dt>{item.term}</dt>
                          <dd>{item.definition}</dd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'journey' && (
          <div className="single-dashboard">
            <UserJourneyDashboard />
          </div>
        )}

        {activeView === 'conversion' && (
          <div className="single-dashboard">
            <ConversionDashboard />
          </div>
        )}
      </main>

      {/* AI Bot Toggle Button */}
      <button
        className="bot-toggle"
        onClick={() => setIsBotOpen(!isBotOpen)}
        aria-label="Toggle AI Assistant"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {isBotOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </>
          )}
        </svg>
      </button>

      {/* AI Bot Panel */}
      <AIBot isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

export default App;
