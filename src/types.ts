export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  AI: Ai;
  ENVIRONMENT: string;
}

// User Journey Types
export interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end: string | null;
  is_churned: boolean;
}

export interface UserActivity {
  id: string;
  session_id: string;
  activity_name: string;
  activity_type: 'page_view' | 'action' | 'event';
  page_path: string;
  duration_seconds: number;
  timestamp: string;
  drop_off: boolean;
}

export interface JourneyMetrics {
  totalSessions: number;
  avgSessionDuration: number;
  churnRate: number;
  dropOffPoints: DropOffPoint[];
  activityBreakdown: ActivityBreakdown[];
  timePerActivity: TimePerActivity[];
}

export interface DropOffPoint {
  page: string;
  dropOffCount: number;
  dropOffRate: number;
}

export interface ActivityBreakdown {
  activity: string;
  count: number;
  percentage: number;
}

export interface TimePerActivity {
  activity: string;
  avgDuration: number;
  totalTime: number;
}

// Conversion Types
export interface ConversionFunnel {
  id: string;
  funnel_name: string;
  step_order: number;
  step_name: string;
  users_entered: number;
  users_completed: number;
  drop_off_count: number;
}

export interface ConversionEvent {
  id: string;
  user_id: string;
  event_type: 'page_view' | 'signup' | 'add_to_cart' | 'checkout' | 'purchase';
  funnel_step: number;
  completed: boolean;
  timestamp: string;
  revenue: number | null;
}

export interface ConversionMetrics {
  bounceRate: number;
  overallConversionRate: number;
  funnelSteps: FunnelStep[];
  dailyConversions: DailyConversion[];
  revenueMetrics: RevenueMetrics;
}

export interface FunnelStep {
  step: string;
  stepOrder: number;
  entered: number;
  completed: number;
  dropOffRate: number;
}

export interface DailyConversion {
  date: string;
  visitors: number;
  conversions: number;
  rate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  avgOrderValue: number;
  conversionValue: number;
}

// AI Bot Types
export interface PredefinedQuestion {
  id: string;
  category: 'journey' | 'conversion' | 'general';
  question: string;
  context: string;
}

export interface AIInsight {
  question: string;
  answer: string;
  recommendations: string[];
  confidence: number;
}

// ============================================
// TRACKING TYPES (Data Collection)
// ============================================

export interface TrackSessionStartRequest {
  userId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  referrerSource?: string;
  userAgent?: string;
}

export interface TrackSessionStartResponse {
  sessionId: string;
  userId: string;
  startedAt: string;
}

export interface TrackActivityRequest {
  sessionId: string;
  activityName: string;
  activityType: 'page_view' | 'action' | 'event';
  pagePath: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface TrackEventRequest {
  sessionId: string;
  userId: string;
  eventType: 'page_view' | 'signup' | 'add_to_cart' | 'checkout' | 'purchase';
  funnelStep: number;
  completed?: boolean;
  revenue?: number;
  metadata?: Record<string, unknown>;
}

export interface TrackSessionEndRequest {
  sessionId: string;
}

export interface TrackFeedbackRequest {
  userId: string;
  sessionId?: string;
  feedbackType: 'rating' | 'comment' | 'nps' | 'survey';
  rating?: number;
  comment?: string;
  pagePath?: string;
}
