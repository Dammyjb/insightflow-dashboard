interface HeaderProps {
  activeView: 'journey' | 'conversion' | 'synoptic';
  onViewChange: (view: 'journey' | 'conversion' | 'synoptic') => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

function Header({ activeView, onViewChange, theme, onThemeToggle }: HeaderProps) {
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
            Overview
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
            Conversion
          </button>
        </nav>
      </div>

      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <span className="last-updated">
          <span className="status-dot"></span>
          Live · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}

export default Header;
