import { useState, useEffect } from 'react';
import UserJourneyDashboard from './components/UserJourneyDashboard';
import ConversionDashboard from './components/ConversionDashboard';
import AIBot from './components/AIBot';
import Header from './components/Header';

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('insightflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
