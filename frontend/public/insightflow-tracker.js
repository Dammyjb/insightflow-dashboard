/**
 * InsightFlow Analytics Tracker SDK
 * Lightweight tracking script for collecting user behavior data
 *
 * Usage:
 * <script src="https://your-worker.workers.dev/insightflow-tracker.js"></script>
 * <script>
 *   InsightFlow.init({
 *     endpoint: 'https://your-worker.workers.dev/api/track',
 *     autoTrackPageViews: true,
 *     autoTrackClicks: true
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  const InsightFlow = {
    // Configuration
    config: {
      endpoint: '/api/track',
      autoTrackPageViews: true,
      autoTrackClicks: false,
      autoTrackForms: false,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      debug: false,
    },

    // State
    sessionId: null,
    userId: null,
    currentActivityId: null,
    pageStartTime: null,
    initialized: false,

    /**
     * Initialize the tracker
     * @param {Object} options - Configuration options
     */
    init: function(options) {
      if (this.initialized) {
        this._log('Already initialized');
        return;
      }

      // Merge options
      Object.assign(this.config, options);

      // Try to restore session from storage
      this._restoreSession();

      // Start a new session if needed
      if (!this.sessionId) {
        this._startSession();
      }

      // Set up automatic tracking
      if (this.config.autoTrackPageViews) {
        this._setupPageViewTracking();
      }

      if (this.config.autoTrackClicks) {
        this._setupClickTracking();
      }

      if (this.config.autoTrackForms) {
        this._setupFormTracking();
      }

      // Set up session end on page unload
      this._setupUnloadHandler();

      // Track initial page view
      if (this.config.autoTrackPageViews) {
        this.trackPageView();
      }

      this.initialized = true;
      this._log('InsightFlow initialized', this.config);
    },

    /**
     * Start a new session
     */
    _startSession: async function() {
      try {
        const response = await this._fetch('/session/start', {
          method: 'POST',
          body: JSON.stringify({
            userId: this._getStoredUserId(),
            referrerSource: this._getReferrerSource(),
            userAgent: navigator.userAgent,
          }),
        });

        if (response.sessionId) {
          this.sessionId = response.sessionId;
          this.userId = response.userId;
          this._saveSession();
          this._log('Session started:', this.sessionId);
        }
      } catch (error) {
        this._log('Failed to start session:', error);
      }
    },

    /**
     * End the current session
     */
    _endSession: async function() {
      if (!this.sessionId) return;

      // Update duration of current page
      await this._updateCurrentActivityDuration();

      try {
        await this._fetch('/session/end', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: this.sessionId,
          }),
        });
        this._log('Session ended:', this.sessionId);
      } catch (error) {
        this._log('Failed to end session:', error);
      }
    },

    /**
     * Track a page view
     * @param {Object} options - Optional page view data
     */
    trackPageView: async function(options = {}) {
      // Update duration of previous page
      await this._updateCurrentActivityDuration();

      const pagePath = options.pagePath || window.location.pathname;
      const activityName = options.activityName || document.title || pagePath;

      this.pageStartTime = Date.now();

      try {
        const response = await this._fetch('/activity', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: this.sessionId,
            activityName: activityName,
            activityType: 'page_view',
            pagePath: pagePath,
            durationSeconds: 0,
            metadata: options.metadata || null,
          }),
        });

        if (response.activityId) {
          this.currentActivityId = response.activityId;
          this._log('Page view tracked:', pagePath);
        }
      } catch (error) {
        this._log('Failed to track page view:', error);
      }
    },

    /**
     * Track a custom action
     * @param {string} actionName - Name of the action
     * @param {Object} options - Optional action data
     */
    trackAction: async function(actionName, options = {}) {
      const pagePath = options.pagePath || window.location.pathname;

      try {
        await this._fetch('/activity', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: this.sessionId,
            activityName: actionName,
            activityType: 'action',
            pagePath: pagePath,
            durationSeconds: options.durationSeconds || 0,
            metadata: options.metadata || null,
          }),
        });
        this._log('Action tracked:', actionName);
      } catch (error) {
        this._log('Failed to track action:', error);
      }
    },

    /**
     * Track a conversion event
     * @param {string} eventType - Type of event (signup, add_to_cart, checkout, purchase)
     * @param {Object} options - Optional event data
     */
    trackEvent: async function(eventType, options = {}) {
      try {
        await this._fetch('/event', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: this.sessionId,
            userId: this.userId,
            eventType: eventType,
            funnelStep: options.funnelStep,
            completed: options.completed !== false,
            revenue: options.revenue || null,
            metadata: options.metadata || null,
          }),
        });
        this._log('Event tracked:', eventType);
      } catch (error) {
        this._log('Failed to track event:', error);
      }
    },

    /**
     * Track user feedback
     * @param {string} feedbackType - Type of feedback (rating, comment, nps, survey)
     * @param {Object} data - Feedback data
     */
    trackFeedback: async function(feedbackType, data = {}) {
      try {
        await this._fetch('/feedback', {
          method: 'POST',
          body: JSON.stringify({
            userId: this.userId,
            sessionId: this.sessionId,
            feedbackType: feedbackType,
            rating: data.rating || null,
            comment: data.comment || null,
            pagePath: data.pagePath || window.location.pathname,
          }),
        });
        this._log('Feedback tracked:', feedbackType);
      } catch (error) {
        this._log('Failed to track feedback:', error);
      }
    },

    /**
     * Identify a user
     * @param {string} userId - User identifier
     */
    identify: function(userId) {
      this.userId = userId;
      this._saveSession();
      this._log('User identified:', userId);
    },

    // ============================================
    // HELPER METHODS
    // ============================================

    _fetch: async function(path, options) {
      const url = this.config.endpoint + path;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return response.json();
    },

    _updateCurrentActivityDuration: async function() {
      if (!this.currentActivityId || !this.pageStartTime) return;

      const durationSeconds = Math.round((Date.now() - this.pageStartTime) / 1000);

      try {
        await this._fetch(`/activity/${this.currentActivityId}/duration`, {
          method: 'PATCH',
          body: JSON.stringify({ durationSeconds }),
        });
      } catch (error) {
        this._log('Failed to update duration:', error);
      }
    },

    _setupPageViewTracking: function() {
      // Track SPA navigation
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const self = this;

      history.pushState = function() {
        originalPushState.apply(this, arguments);
        self.trackPageView();
      };

      history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        self.trackPageView();
      };

      window.addEventListener('popstate', () => this.trackPageView());
    },

    _setupClickTracking: function() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button, [data-track]');
        if (target) {
          const trackName = target.getAttribute('data-track') ||
                           target.textContent?.trim().slice(0, 50) ||
                           'Click';
          this.trackAction(trackName, {
            metadata: {
              element: target.tagName,
              href: target.href || null,
            },
          });
        }
      });
    },

    _setupFormTracking: function() {
      document.addEventListener('submit', (e) => {
        const form = e.target;
        const formName = form.getAttribute('data-track') ||
                        form.getAttribute('name') ||
                        form.id ||
                        'Form Submit';
        this.trackAction(formName, {
          metadata: {
            formAction: form.action,
          },
        });
      });
    },

    _setupUnloadHandler: function() {
      // Use sendBeacon for reliable tracking on page unload
      window.addEventListener('beforeunload', () => {
        this._updateCurrentActivityDuration();
      });

      // Also try to end session on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this._updateCurrentActivityDuration();
        }
      });
    },

    _saveSession: function() {
      try {
        const data = {
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('insightflow_session', JSON.stringify(data));
        localStorage.setItem('insightflow_user', this.userId);
      } catch (e) {
        // Storage not available
      }
    },

    _restoreSession: function() {
      try {
        const data = sessionStorage.getItem('insightflow_session');
        if (data) {
          const parsed = JSON.parse(data);
          // Check if session is still valid (within timeout)
          if (Date.now() - parsed.timestamp < this.config.sessionTimeout) {
            this.sessionId = parsed.sessionId;
            this.userId = parsed.userId;
            this._log('Session restored:', this.sessionId);
          }
        }
      } catch (e) {
        // Storage not available
      }
    },

    _getStoredUserId: function() {
      try {
        return localStorage.getItem('insightflow_user');
      } catch (e) {
        return null;
      }
    },

    _getReferrerSource: function() {
      const referrer = document.referrer;
      if (!referrer) return 'direct';

      const url = new URL(referrer);
      const hostname = url.hostname.toLowerCase();

      if (hostname.includes('google')) return 'google';
      if (hostname.includes('facebook') || hostname.includes('fb.')) return 'facebook';
      if (hostname.includes('twitter') || hostname.includes('t.co')) return 'twitter';
      if (hostname.includes('linkedin')) return 'linkedin';
      if (hostname.includes('instagram')) return 'instagram';
      if (hostname.includes('youtube')) return 'youtube';

      return hostname;
    },

    _log: function(...args) {
      if (this.config.debug) {
        console.log('[InsightFlow]', ...args);
      }
    },
  };

  // Expose to global scope
  window.InsightFlow = InsightFlow;

})(window);
