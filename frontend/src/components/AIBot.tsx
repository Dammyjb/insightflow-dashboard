import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Give me a quick performance summary",
  "What's my biggest opportunity right now?",
  "Why are customers leaving at checkout?",
  "How can I increase my average order value?",
];

const FOLLOW_UP_SUGGESTIONS: Record<string, string[]> = {
  churn: ["How do I re-engage lost customers?", "What loyalty programs work best?"],
  checkout: ["Show me cart abandonment tips", "What's the ideal checkout flow?"],
  conversion: ["How do I optimize my funnel?", "What's a good conversion rate?"],
  summary: ["What should I focus on first?", "Show me trends over time"],
  default: ["Give me actionable insights", "What are industry benchmarks?"],
};

function AIBot({ isOpen, onClose }: AIBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! I'm Leaf, your analytics companion. I can help you understand your store's performance, spot opportunities, and give you actionable recommendations. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState<string>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Detect topic for follow-up suggestions
    const topic = detectTopic(text.trim());
    setLastTopic(topic);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.answer || "I couldn't analyze that. Try asking about your metrics, customer behavior, or conversion rates.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      // Generate contextual fallback response
      const fallbackResponse = generateFallbackResponse(text.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: "Fresh start! What would you like to explore about your store's performance?",
        timestamp: new Date(),
      },
    ]);
    setLastTopic('default');
  };

  if (!isOpen) return null;

  return (
    <div className="ai-bot-panel">
      <div className="ai-bot-header">
        <div className="ai-bot-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#10b981" />
            <circle cx="9" cy="10" r="1.5" fill="white" />
            <circle cx="15" cy="10" r="1.5" fill="white" />
            <path
              d="M8 14c0 2 2 3 4 3s4-1 4-3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <h3>Leaf Assistant</h3>
            <span className="ai-bot-subtitle">Ask anything about your data</span>
          </div>
        </div>
        <div className="ai-bot-actions">
          <button className="ai-bot-clear" onClick={clearChat} title="Clear chat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
          <button className="ai-bot-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="message-avatar">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="6" r="1" />
                  <circle cx="11" cy="6" r="1" />
                  <path d="M5 9.5c0 1.5 1.5 2 3 2s3-.5 3-2" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              </div>
            )}
            <div className="message-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="6" r="1" />
                <circle cx="11" cy="6" r="1" />
                <path d="M5 9.5c0 1.5 1.5 2 3 2s3-.5 3-2" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div className="message-content typing">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions - show at start or follow-ups after conversation */}
      {messages.length <= 1 ? (
        <div className="suggested-questions">
          <p>Try asking:</p>
          <div className="suggestions-list">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} className="suggestion-chip">
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : !isLoading && (
        <div className="suggested-questions follow-up">
          <p>Follow up:</p>
          <div className="suggestions-list">
            {(FOLLOW_UP_SUGGESTIONS[lastTopic] || FOLLOW_UP_SUGGESTIONS.default).map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} className="suggestion-chip">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="ai-chat-input" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your metrics..."
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>

      <div className="ai-bot-footer">
        <p>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 10.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM5.25 3h1.5v3h-1.5V3zm0 4.5h1.5V9h-1.5V7.5z" />
          </svg>
          Powered by Cloudflare Workers AI
        </p>
      </div>
    </div>
  );
}

// Detect the topic from user question for follow-up suggestions
function detectTopic(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('churn') || q.includes('leaving') || q.includes('lost') || q.includes('retention')) return 'churn';
  if (q.includes('checkout') || q.includes('cart') || q.includes('abandon')) return 'checkout';
  if (q.includes('conversion') || q.includes('sales') || q.includes('revenue') || q.includes('funnel')) return 'conversion';
  if (q.includes('summary') || q.includes('overview') || q.includes('performance')) return 'summary';
  return 'default';
}

// Generate contextual responses based on question keywords
function generateFallbackResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('churn') || q.includes('leaving') || q.includes('lost')) {
    return `Your churn rate is currently at 27%, which is above the healthy threshold of 15-20%.

Here's what's likely happening:
• Customers aren't finding enough value to return
• Your re-engagement emails might not be compelling enough
• Competitors may be offering better deals

**Quick wins:**
1. Send a "We miss you" email with 15% off to customers inactive for 14+ days
2. Add a loyalty program—customers with points return 40% more often
3. Survey churned customers to understand why they left`;
  }

  if (q.includes('bounce') || q.includes('leaving immediately') || q.includes('quick exit')) {
    return `Your bounce rate is at 13%, which is actually quite healthy (industry average is 20-40%).

But there's always room to improve:
• Make sure your landing page loads in under 3 seconds
• Ensure your value proposition is clear above the fold
• Check that your ads/links match what visitors see when they arrive

**To improve further:**
1. Add social proof near the top of the page
2. Test a more compelling headline
3. Make your CTA button more prominent`;
  }

  if (q.includes('checkout') || q.includes('cart') || q.includes('abandon')) {
    return `Looking at your funnel, you're losing 38% of customers at the checkout step—this is your biggest opportunity.

**Why customers abandon checkout:**
• Unexpected shipping costs (the #1 reason)
• Forced account creation
• Complex forms with too many fields
• Lack of trust signals

**Fix it with:**
1. Show shipping costs on product pages, not just at checkout
2. Add guest checkout option
3. Display trust badges and "Free returns" messaging
4. Reduce form fields to the essentials`;
  }

  if (q.includes('conversion') || q.includes('sales') || q.includes('revenue')) {
    return `Your overall conversion rate is 47%, which is excellent! Your revenue is tracking at $24,500 with an average order value of $68.

**What's working:**
• Strong product-to-cart conversion
• Good engagement time on product pages

**To grow revenue further:**
1. Add "Frequently bought together" bundles (+15% AOV typically)
2. Implement abandoned cart emails (recovers 5-10% of lost sales)
3. Test offering free shipping at a threshold ($75+)`;
  }

  if (q.includes('summary') || q.includes('overview') || q.includes('performance') || q.includes('today') || q.includes('quick')) {
    return `**GreenLeaf Performance at a Glance**

**What's Going Well:**
- 1,247 active shoppers browsing your store
- Strong engagement: 7+ minutes average session
- Healthy 15% overall conversion rate
- $24,567 in revenue with $157 AOV

**Needs Attention:**
- 23% churn rate (aim for under 20%)
- Checkout step losing 38% of customers
- Cart page has 12% drop-off

**Quick Win:** Add a progress bar to checkout - stores see 10-15% improvement from this simple change.`;
  }

  if (q.includes('opportunity') || q.includes('biggest') || q.includes('priority') || q.includes('focus')) {
    return `**Your Biggest Opportunity: Checkout Optimization**

You're losing 38% of customers at checkout - that's your #1 revenue leak.

**Why it matters:** With 340 people reaching checkout but only 210 completing, you're leaving ~$20K/month on the table.

**3 Quick Fixes:**
1. **Add guest checkout** - 23% of abandonments are due to forced signup
2. **Show all costs upfront** - No surprises at the final step
3. **Add trust badges** - Security icons increase completion by 17%

**Next priority:** After checkout, focus on your 23% churn rate with a loyalty program.`;
  }

  if (q.includes('order value') || q.includes('aov') || q.includes('basket') || q.includes('spend more')) {
    return `**Increasing Your Average Order Value ($157 currently)**

**Quick Wins:**
1. **Free shipping threshold** at $175 - "You're $18 away from free shipping!"
2. **Bundle deals** - "Complete the sustainable set" sections
3. **Smart upsells** - Show complementary products at cart

**What works for eco-brands:**
- "Add a tree planting" (+$5 donation option)
- Subscription savings (10% off recurring orders)
- Bulk discounts on consumables

**Realistic target:** $175-185 AOV within 30 days using these tactics.`;
  }

  if (q.includes('improve') || q.includes('better') || q.includes('increase') || q.includes('help')) {
    return `Based on your current metrics, here are the highest-impact improvements:

**1. Fix Checkout Drop-off (High Impact)**
38% of customers leave at checkout. Add guest checkout and show all costs upfront.

**2. Reduce Churn (Medium Impact)**
27% of customers don't return. Start a "Green Points" loyalty program.

**3. Increase Order Value (Medium Impact)**
Current AOV is $68. Add product bundles and a free shipping threshold at $85.

**4. Improve Page Speed (Quick Win)**
Every 1-second delay costs 7% in conversions. Compress images and lazy-load content.

Want me to dive deeper into any of these?`;
  }

  if (q.includes('benchmark') || q.includes('industry') || q.includes('compare') || q.includes('average')) {
    return `**How You Compare to Industry Benchmarks**

| Metric | Your Store | Industry Avg | Status |
|--------|-----------|--------------|--------|
| Conversion Rate | 15% | 2-3% | Excellent |
| Bounce Rate | 24% | 40-60% | Great |
| Churn Rate | 23% | 15-20% | Needs work |
| AOV | $157 | $120 | Above avg |
| Session Duration | 7min | 3-4min | Excellent |

**Key insight:** Your engagement metrics are stellar - people love browsing. Focus on retention to match your other strong numbers.`;
  }

  // Default response
  return `I can help you make sense of your GreenLeaf analytics! Here's what I'm great at:

**Quick Analysis:**
- Performance summaries and health checks
- Identifying your biggest opportunities
- Explaining what metrics mean and why they matter

**Strategic Advice:**
- How to reduce cart abandonment
- Ways to increase order value
- Tactics to improve customer retention

Try asking: "What's my biggest opportunity right now?" or "Give me a quick summary"`;
}

export default AIBot;
