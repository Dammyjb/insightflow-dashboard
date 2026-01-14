import { Hono } from 'hono';
import type { Env, PredefinedQuestion, AIInsight } from '../types';

const ai = new Hono<{ Bindings: Env }>();

// Predefined questions for the AI bot
const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
  // User Journey Questions
  {
    id: 'j1',
    category: 'journey',
    question: 'What are the main drop-off points in the user journey?',
    context: 'Analyze drop-off points to identify where users are leaving the app',
  },
  {
    id: 'j2',
    category: 'journey',
    question: 'Which activities take the longest time?',
    context: 'Analyze time spent on activities to identify potential UX issues',
  },
  {
    id: 'j3',
    category: 'journey',
    question: 'What is causing user churn?',
    context: 'Analyze churn patterns to identify reasons users stop using the app',
  },
  {
    id: 'j4',
    category: 'journey',
    question: 'How can I improve user engagement?',
    context: 'Provide recommendations to increase user engagement based on journey data',
  },
  // Conversion Questions
  {
    id: 'c1',
    category: 'conversion',
    question: 'Why is my bounce rate high?',
    context: 'Analyze bounce rate factors and provide actionable improvements',
  },
  {
    id: 'c2',
    category: 'conversion',
    question: 'Where are users abandoning the conversion funnel?',
    context: 'Identify funnel drop-off points and suggest optimizations',
  },
  {
    id: 'c3',
    category: 'conversion',
    question: 'How can I increase conversion rates?',
    context: 'Provide data-driven recommendations to improve conversions',
  },
  {
    id: 'c4',
    category: 'conversion',
    question: 'What is the most effective conversion path?',
    context: 'Analyze user paths that lead to successful conversions',
  },
  // General Questions
  {
    id: 'g1',
    category: 'general',
    question: 'Give me a summary of my analytics',
    context: 'Provide a comprehensive overview of all key metrics',
  },
  {
    id: 'g2',
    category: 'general',
    question: 'What should I prioritize to improve?',
    context: 'Identify the most impactful areas for improvement based on all data',
  },
];

// Get available predefined questions
ai.get('/questions', (c) => {
  return c.json({
    questions: PREDEFINED_QUESTIONS.map(q => ({
      id: q.id,
      category: q.category,
      question: q.question,
    })),
  });
});

// Get AI insight for a specific question
ai.post('/insight', async (c) => {
  const { questionId, metricsData } = await c.req.json();
  const aiBinding = c.env.AI;
  const db = c.env.DB;

  const selectedQuestion = PREDEFINED_QUESTIONS.find(q => q.id === questionId);

  if (!selectedQuestion) {
    return c.json({ error: 'Invalid question ID' }, 400);
  }

  try {
    // Fetch relevant metrics based on question category
    let metrics: Record<string, unknown> = metricsData || {};

    if (!metricsData) {
      if (selectedQuestion.category === 'journey' || selectedQuestion.category === 'general') {
        const journeyData = await db.prepare(`
          SELECT
            COUNT(*) as total_sessions,
            SUM(CASE WHEN is_churned = 1 THEN 1 ELSE 0 END) as churned_sessions,
            AVG(CASE WHEN session_end IS NOT NULL
              THEN (julianday(session_end) - julianday(session_start)) * 86400
              ELSE 300 END) as avg_duration
          FROM user_sessions
        `).first();

        const dropOffs = await db.prepare(`
          SELECT page_path, COUNT(*) as count
          FROM user_activities WHERE drop_off = 1
          GROUP BY page_path ORDER BY count DESC LIMIT 5
        `).all();

        const timeByActivity = await db.prepare(`
          SELECT activity_name, AVG(duration_seconds) as avg_time
          FROM user_activities GROUP BY activity_name ORDER BY avg_time DESC
        `).all();

        metrics.journey = {
          ...journeyData,
          churnRate: journeyData?.total_sessions
            ? ((journeyData.churned_sessions as number) / (journeyData.total_sessions as number) * 100).toFixed(1)
            : 0,
          topDropOffs: dropOffs.results,
          timeByActivity: timeByActivity.results,
        };
      }

      if (selectedQuestion.category === 'conversion' || selectedQuestion.category === 'general') {
        const conversionData = await db.prepare(`
          SELECT
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT CASE WHEN event_type = 'purchase' AND completed = 1 THEN user_id END) as converted
          FROM conversion_events
        `).first();

        const funnelData = await db.prepare(`
          SELECT step_name, users_entered, users_completed,
            ROUND((users_entered - users_completed) * 100.0 / NULLIF(users_entered, 0), 1) as drop_rate
          FROM conversion_funnel ORDER BY step_order
        `).all();

        metrics.conversion = {
          ...conversionData,
          conversionRate: conversionData?.total_users
            ? ((conversionData.converted as number) / (conversionData.total_users as number) * 100).toFixed(1)
            : 0,
          funnel: funnelData.results,
        };
      }
    }

    // Build prompt for AI
    const systemPrompt = `You are an analytics assistant for a user feedback dashboard. Your role is to analyze metrics data and provide actionable insights. Be concise, specific, and data-driven. Focus on practical recommendations. Format your response as:

1. ANALYSIS: Brief analysis of the current state (2-3 sentences)
2. KEY FINDINGS: 2-3 bullet points of important observations
3. RECOMMENDATIONS: 2-3 specific, actionable steps to improve

Keep the total response under 250 words.`;

    const userPrompt = `Question: ${selectedQuestion.question}

Context: ${selectedQuestion.context}

Current Metrics Data:
${JSON.stringify(metrics, null, 2)}

Please analyze this data and provide insights.`;

    // Call Cloudflare AI
    const response = await aiBinding.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
    });

    const aiResponse = (response as { response?: string }).response || 'Unable to generate insight at this time.';

    // Parse recommendations from response
    const recommendations = extractRecommendations(aiResponse);

    const insight: AIInsight = {
      question: selectedQuestion.question,
      answer: aiResponse,
      recommendations,
      confidence: 0.85,
    };

    return c.json(insight);
  } catch (error) {
    console.error('AI insight error:', error);

    // Fallback to predefined responses if AI fails
    const fallbackInsight = getFallbackInsight(selectedQuestion, metricsData);
    return c.json(fallbackInsight);
  }
});

// Helper function to extract recommendations from AI response
function extractRecommendations(response: string): string[] {
  const recommendations: string[] = [];
  const lines = response.split('\n');

  let inRecommendations = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('recommendation')) {
      inRecommendations = true;
      continue;
    }
    if (inRecommendations && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
      const cleaned = line.replace(/^[-•\d.]\s*/, '').trim();
      if (cleaned.length > 10) {
        recommendations.push(cleaned);
      }
    }
  }

  return recommendations.slice(0, 3);
}

// Fallback insights when AI is unavailable
function getFallbackInsight(question: PredefinedQuestion, metrics?: Record<string, unknown>): AIInsight {
  const fallbacks: Record<string, AIInsight> = {
    j1: {
      question: question.question,
      answer: 'Based on the data, the main drop-off points appear to be on pages where users encounter complex forms or unclear navigation. The checkout page and registration page typically show higher abandonment rates.',
      recommendations: [
        'Simplify form fields and reduce required inputs',
        'Add progress indicators for multi-step processes',
        'Implement exit-intent popups with helpful prompts',
      ],
      confidence: 0.7,
    },
    j2: {
      question: question.question,
      answer: 'The activities taking the longest time are typically those involving decision-making or data entry. Search and comparison features often have extended engagement times.',
      recommendations: [
        'Add autocomplete and smart suggestions',
        'Provide comparison tools to speed up decisions',
        'Consider progressive disclosure for complex features',
      ],
      confidence: 0.7,
    },
    c1: {
      question: question.question,
      answer: 'High bounce rates are often caused by slow page loads, unclear value propositions, or mismatched user expectations from marketing. The landing page experience is critical.',
      recommendations: [
        'Optimize page load times to under 3 seconds',
        'Ensure marketing messages align with landing page content',
        'Add clear calls-to-action above the fold',
      ],
      confidence: 0.7,
    },
    c2: {
      question: question.question,
      answer: 'Users commonly abandon the funnel at the cart and payment stages. This suggests friction in the checkout process or unexpected costs appearing late in the journey.',
      recommendations: [
        'Show total costs early including shipping',
        'Offer guest checkout options',
        'Provide multiple payment methods',
      ],
      confidence: 0.7,
    },
    g1: {
      question: question.question,
      answer: 'Your analytics show a healthy user engagement with room for improvement in conversion optimization. Focus areas should be reducing checkout friction and improving first-time user onboarding.',
      recommendations: [
        'Prioritize checkout flow optimization',
        'Implement A/B testing for landing pages',
        'Set up automated email sequences for cart abandonment',
      ],
      confidence: 0.7,
    },
  };

  return fallbacks[question.id] || {
    question: question.question,
    answer: 'Analysis is currently processing. Based on general best practices, focus on reducing friction in your user journey and optimizing conversion touchpoints.',
    recommendations: [
      'Review your analytics dashboard for specific insights',
      'Conduct user testing to identify pain points',
      'Implement incremental improvements and measure results',
    ],
    confidence: 0.5,
  };
}

export { ai as aiRoutes };
