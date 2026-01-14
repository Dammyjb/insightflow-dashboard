-- InsightFlow Analytics Dashboard Schema
-- D1 Database Schema for User Journey and Conversion Tracking

-- User Sessions Table
-- Tracks individual user sessions from start to end
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    is_churned INTEGER DEFAULT 0,
    device_type TEXT,
    browser TEXT,
    referrer_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Activities Table
-- Tracks individual activities within a session
CREATE TABLE IF NOT EXISTS user_activities (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    activity_type TEXT CHECK(activity_type IN ('page_view', 'action', 'event')) DEFAULT 'page_view',
    page_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    drop_off INTEGER DEFAULT 0,
    metadata TEXT,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id)
);

-- Conversion Funnel Table
-- Defines the conversion funnel steps and aggregate metrics
CREATE TABLE IF NOT EXISTS conversion_funnel (
    id TEXT PRIMARY KEY,
    funnel_name TEXT NOT NULL DEFAULT 'Main Funnel',
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    users_entered INTEGER DEFAULT 0,
    users_completed INTEGER DEFAULT 0,
    drop_off_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversion Events Table
-- Tracks individual conversion events for each user
CREATE TABLE IF NOT EXISTS conversion_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT CHECK(event_type IN ('page_view', 'signup', 'add_to_cart', 'checkout', 'purchase')) NOT NULL,
    funnel_step INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revenue REAL,
    metadata TEXT
);

-- User Feedback Table
-- Stores user feedback data
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    feedback_type TEXT CHECK(feedback_type IN ('rating', 'comment', 'nps', 'survey')) NOT NULL,
    rating INTEGER,
    comment TEXT,
    page_path TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_activities_session ON user_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_page ON user_activities(page_path);
CREATE INDEX IF NOT EXISTS idx_activities_dropoff ON user_activities(drop_off);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
