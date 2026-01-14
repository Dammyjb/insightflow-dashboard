interface HeaderProps {
  activeView: 'journey' | 'conversion' | 'synoptic';
  onViewChange: (view: 'journey' | 'conversion' | 'synoptic') => void;
}

function Header({ activeView, onViewChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#gradient)" />
            <path
              d="M8 20L13 15L17 19L24 12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="12" r="2" fill="white" />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text">InsightFlow</span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeView === 'synoptic' ? 'active' : ''}`}
          onClick={() => onViewChange('synoptic')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
          Synoptic View
        </button>
        <button
          className={`nav-tab ${activeView === 'journey' ? 'active' : ''}`}
          onClick={() => onViewChange('journey')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 14L6 10L10 12L14 6" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="10" cy="12" r="1.5" />
            <circle cx="14" cy="6" r="1.5" />
          </svg>
          User Journey
        </button>
        <button
          className={`nav-tab ${activeView === 'conversion' ? 'active' : ''}`}
          onClick={() => onViewChange('conversion')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 14V8h3v6H2zM6.5 14V5h3v9h-3zM11 14V2h3v12h-3z" />
          </svg>
          Conversion Rates
        </button>
      </nav>

      <div className="header-right">
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </header>
  );
}

export default Header;
