import { useState } from 'react';
import UserJourneyDashboard from './components/UserJourneyDashboard';
import ConversionDashboard from './components/ConversionDashboard';
import AIBot from './components/AIBot';
import Header from './components/Header';

type DashboardView = 'journey' | 'conversion' | 'synoptic';

function App() {
  const [activeView, setActiveView] = useState<DashboardView>('synoptic');
  const [isBotOpen, setIsBotOpen] = useState(false);

  return (
    <div className="app">
      <Header activeView={activeView} onViewChange={setActiveView} />

      <main className="main-content">
        {activeView === 'synoptic' && (
          <div className="synoptic-view">
            <div className="dashboard-panel">
              <UserJourneyDashboard compact />
            </div>
            <div className="dashboard-panel">
              <ConversionDashboard compact />
            </div>
          </div>
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
