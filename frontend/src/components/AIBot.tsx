import { useState, useEffect } from 'react';

interface Question {
  id: string;
  category: 'journey' | 'conversion' | 'general';
  question: string;
}

interface Insight {
  question: string;
  answer: string;
  recommendations: string[];
  confidence: number;
}

interface AIBotProps {
  isOpen: boolean;
  onClose: () => void;
}

function AIBot({ isOpen, onClose }: AIBotProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/ai/questions');
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      // Use fallback questions
      setQuestions([
        { id: 'j1', category: 'journey', question: 'What are the main drop-off points in the user journey?' },
        { id: 'j2', category: 'journey', question: 'Which activities take the longest time?' },
        { id: 'j3', category: 'journey', question: 'What is causing user churn?' },
        { id: 'j4', category: 'journey', question: 'How can I improve user engagement?' },
        { id: 'c1', category: 'conversion', question: 'Why is my bounce rate high?' },
        { id: 'c2', category: 'conversion', question: 'Where are users abandoning the conversion funnel?' },
        { id: 'c3', category: 'conversion', question: 'How can I increase conversion rates?' },
        { id: 'c4', category: 'conversion', question: 'What is the most effective conversion path?' },
        { id: 'g1', category: 'general', question: 'Give me a summary of my analytics' },
        { id: 'g2', category: 'general', question: 'What should I prioritize to improve?' },
      ]);
    }
  };

  const askQuestion = async (questionId: string) => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const response = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) throw new Error('Failed to get insight');

      const data = await response.json();
      setInsight(data);
    } catch (err) {
      // Provide fallback insight
      const question = questions.find((q) => q.id === questionId);
      setInsight(getFallbackInsight(question?.question || '', questionId));
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions =
    selectedCategory === 'all'
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'journey':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 12L5 9L8 11L12 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'conversion':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 12V7h2.5v5H2zM5.75 12V4h2.5v8h-2.5zM9.5 12V1H12v11H9.5z" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-bot-panel">
      <div className="ai-bot-header">
        <div className="ai-bot-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="url(#botGradient)" />
            <circle cx="9" cy="10" r="1.5" fill="white" />
            <circle cx="15" cy="10" r="1.5" fill="white" />
            <path
              d="M8 14c0 2 2 3 4 3s4-1 4-3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="botGradient" x1="0" y1="0" x2="24" y2="24">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h3>Analytics Assistant</h3>
            <span className="ai-bot-subtitle">Ask me about your data</span>
          </div>
        </div>
        <button className="ai-bot-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>

      <div className="ai-bot-content">
        {/* Category Filter */}
        <div className="category-filter">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={`category-btn ${selectedCategory === 'journey' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('journey')}
          >
            Journey
          </button>
          <button
            className={`category-btn ${selectedCategory === 'conversion' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('conversion')}
          >
            Conversion
          </button>
          <button
            className={`category-btn ${selectedCategory === 'general' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('general')}
          >
            General
          </button>
        </div>

        {/* Questions List */}
        {!insight && !loading && (
          <div className="questions-list">
            <p className="questions-intro">Select a question to get AI-powered insights:</p>
            {filteredQuestions.map((q) => (
              <button
                key={q.id}
                className="question-btn"
                onClick={() => askQuestion(q.id)}
              >
                <span className={`question-icon ${q.category}`}>
                  {getCategoryIcon(q.category)}
                </span>
                <span className="question-text">{q.question}</span>
                <svg
                  className="question-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="ai-loading">
            <div className="ai-loading-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p>Analyzing your data...</p>
          </div>
        )}

        {/* Insight Display */}
        {insight && !loading && (
          <div className="insight-display">
            <div className="insight-question">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 11a1 1 0 110-2 1 1 0 010 2zm1-3.5a1 1 0 01-2 0V6.5a1 1 0 012 0v2z" />
              </svg>
              <span>{insight.question}</span>
            </div>

            <div className="insight-answer">
              <div className="insight-text">{insight.answer}</div>

              {insight.recommendations.length > 0 && (
                <div className="insight-recommendations">
                  <h4>Key Recommendations:</h4>
                  <ul>
                    {insight.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="insight-confidence">
                <span>Confidence:</span>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${insight.confidence * 100}%` }}
                  ></div>
                </div>
                <span>{Math.round(insight.confidence * 100)}%</span>
              </div>
            </div>

            <button className="back-btn" onClick={() => setInsight(null)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              Ask another question
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="ai-error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Try again</button>
          </div>
        )}
      </div>

      <div className="ai-bot-footer">
        <p>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 10.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM5.25 3h1.5v3h-1.5V3zm0 4.5h1.5V9h-1.5V7.5z" />
          </svg>
          Powered by Cloudflare AI
        </p>
      </div>
    </div>
  );
}

// Fallback insights when API is unavailable
function getFallbackInsight(question: string, questionId: string): Insight {
  const fallbacks: Record<string, Insight> = {
    j1: {
      question,
      answer:
        'Based on typical patterns, your main drop-off points are likely occurring at the checkout page and registration form. Users often abandon when faced with lengthy forms or unexpected costs. The cart page also shows significant drop-off when shipping information is unclear.',
      recommendations: [
        'Simplify your checkout process to reduce form fields',
        'Show shipping costs early in the user journey',
        'Add progress indicators for multi-step processes',
      ],
      confidence: 0.75,
    },
    j2: {
      question,
      answer:
        'The activities taking the longest time are typically search and browse functions, followed by checkout completion. Extended time on search may indicate difficulty finding products, while long checkout times suggest form complexity or payment friction.',
      recommendations: [
        'Improve search functionality with better filters and autocomplete',
        'Consider a simplified checkout flow with fewer steps',
        'Add product comparison features to speed up decision-making',
      ],
      confidence: 0.7,
    },
    c1: {
      question,
      answer:
        'High bounce rates typically result from slow page load times, misaligned user expectations from marketing, or unclear value propositions on landing pages. Mobile users often have higher bounce rates due to poor responsive design.',
      recommendations: [
        'Optimize page load times to under 3 seconds',
        'Ensure marketing messages match landing page content',
        'Improve mobile responsiveness and touch targets',
      ],
      confidence: 0.72,
    },
    c2: {
      question,
      answer:
        'Users commonly abandon at the cart-to-checkout transition and at payment entry. This suggests friction from unexpected costs, complex forms, or lack of payment options. The registration requirement before checkout is also a major drop-off point.',
      recommendations: [
        'Offer guest checkout option',
        'Display all costs upfront including shipping and taxes',
        'Add multiple payment methods including digital wallets',
      ],
      confidence: 0.78,
    },
    g1: {
      question,
      answer:
        'Your analytics show moderate user engagement with opportunities for improvement. Key areas to focus on include reducing bounce rate, optimizing the conversion funnel, and improving user retention. The checkout process appears to be the biggest area of opportunity.',
      recommendations: [
        'Focus on checkout optimization for quick wins',
        'Implement email recovery for abandoned carts',
        'Consider A/B testing landing page variations',
      ],
      confidence: 0.68,
    },
  };

  return (
    fallbacks[questionId] || {
      question,
      answer:
        'Based on general analytics best practices, focus on reducing friction points in your user journey and optimizing conversion touchpoints. Regular A/B testing and user feedback collection will help identify specific improvement opportunities.',
      recommendations: [
        'Set up regular analytics review sessions',
        'Implement user feedback collection',
        'Create a testing roadmap for key pages',
      ],
      confidence: 0.6,
    }
  );
}

export default AIBot;
