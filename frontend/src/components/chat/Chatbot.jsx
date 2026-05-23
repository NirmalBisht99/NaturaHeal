// src/components/chat/Chatbot.jsx
// ─────────────────────────────────────────────────────────────
//  Gemini-powered chatbot via backend /api/chat endpoint.
//  Parses "💬 Quick replies: ..." from bot responses and renders
//  them as tappable suggestion chips.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../lib/constants.js";
import { DEMO_MODE } from "../../lib/supabase.js";

// ── Local fallback responses ─────────────────────────────────
const RESPONSES = {
  sleep:    "For stress & sleep, **Ashwagandha Rasayana 30C** (₹649) is excellent — calms the nervous system naturally. 🌙\n\n💬 Quick replies: \"Tell me more\" | \"Side effects?\" | \"Delivery info\"",
  immunity: "For immunity, we recommend:\n• **Tulsi Immunity Drops** (₹549)\n• **Giloy Fever Guard** (₹349)\n• **Amla Rasayana** (₹399)\n\nAll AYUSH certified. 💚\n\n💬 Quick replies: \"Add combo\" | \"Tell me more\" | \"Delivery info\"",
  delivery: "📦 **FREE delivery on orders above ₹499!** Otherwise ₹49 flat. 3–7 business days. SMS updates at every step!\n\n💬 Quick replies: \"Payment options\" | \"Return policy\" | \"Shop now\"",
  payment:  "We accept:\n• **Cash on Delivery (COD)**\n• **Razorpay** — UPI, Cards, Net Banking, Wallets\n\nAll secured with 256-bit SSL 🔒\n\n💬 Quick replies: \"Delivery info\" | \"Return policy\" | \"Shop now\"",
  return:   "**7-day easy return policy!** 🙏 Email namaste@naturaheal.in or WhatsApp +91 7579189494.\n\n💬 Quick replies: \"Contact support\" | \"Track order\" | \"Shop more\"",
  default:  "Namaste! 🌿 I'm your NaturaHeal Ayurvedic consultant. What are you experiencing today?\n\n💬 Quick replies: \"Stress & sleep\" | \"Immunity\" | \"Digestion\" | \"Skin care\"",
};

function getFallbackResponse(message) {
  const m = message.toLowerCase();
  if (m.includes("sleep") || m.includes("stress") || m.includes("anxiety")) return RESPONSES.sleep;
  if (m.includes("immun") || m.includes("fever") || m.includes("flu"))       return RESPONSES.immunity;
  if (m.includes("deliver") || m.includes("shipping"))                        return RESPONSES.delivery;
  if (m.includes("pay") || m.includes("cod") || m.includes("upi"))           return RESPONSES.payment;
  if (m.includes("return") || m.includes("refund"))                           return RESPONSES.return;
  return RESPONSES.default;
}

// ── Parse quick replies out of a bot message ─────────────────
// Looks for: 💬 Quick replies: "A" | "B" | "C"
// Returns { text: string, suggestions: string[] }
function parseMessage(raw) {
  const marker = "💬 Quick replies:";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { text: raw.trim(), suggestions: [] };

  const text        = raw.slice(0, idx).trim();
  const suggestPart = raw.slice(idx + marker.length).trim();

  // Extract quoted strings: "Option A" | "Option B"
  const suggestions = [];
  const re = /"([^"]+)"/g;
  let match;
  while ((match = re.exec(suggestPart)) !== null) {
    suggestions.push(match[1]);
  }

  return { text, suggestions };
}

// ── Render message text with basic **bold** support ──────────
function RenderText({ text }) {
  // Split on **...**
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

// ── Typing indicator component ────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg,#15803D,#166534)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0,
      }}>🌿</div>
      <div style={{
        background: "#F3F4F6", borderRadius: "18px 18px 18px 4px",
        padding: "12px 16px", display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 7, height: 7, background: "#9CA3AF", borderRadius: "50%",
            display: "inline-block",
            animation: `chatPulse 1.2s ease ${i * 0.25}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg, fmtTime, onSuggestion }) {
  const isUser = msg.role === "user";
  const { text, suggestions } = isUser
    ? { text: msg.text, suggestions: [] }
    : parseMessage(msg.text);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 2 }}>
      {!isUser && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "85%" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,#15803D,#166534)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, flexShrink: 0,
          }}>🌿</div>
          <div>
            <div style={{
              background: "#F3F4F6",
              color: "#111827",
              borderRadius: "18px 18px 18px 4px",
              padding: "10px 14px",
              fontSize: 13, lineHeight: 1.65,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}>
              <RenderText text={text} />
            </div>

            {/* Suggestion chips */}
            {suggestions.length > 0 && (
              <div style={{
                display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8,
                paddingLeft: 0,
              }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSuggestion(s)}
                    className="suggestion-chip"
                    style={{
                      background: "#fff",
                      border: "1.5px solid #15803D",
                      color: "#15803D",
                      borderRadius: 16,
                      padding: "5px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .15s",
                      fontFamily: "inherit",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isUser && (
        <div style={{
          maxWidth: "80%",
          background: "linear-gradient(135deg,#15803D,#166534)",
          color: "#fff",
          borderRadius: "18px 18px 4px 18px",
          padding: "10px 14px",
          fontSize: 13, lineHeight: 1.65,
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1, paddingLeft: isUser ? 0 : 36 }}>
        {fmtTime(msg.time)}
      </div>
    </div>
  );
}

// ── Main Chatbot component ────────────────────────────────────
export default function Chatbot() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([
    {
      role: "bot",
      text: "Namaste! 🙏 I'm Priya, your NaturaHeal Ayurvedic consultant.\n\nTell me what you're experiencing and I'll suggest the right remedy for you!\n\n💬 Quick replies: \"Stress & sleep\" | \"Immunity\" | \"Digestion\" | \"Skin care\"",
      time: new Date(),
    },
  ]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  // history holds only PAST exchanges (NOT the current in-flight message)
  const [history,     setHistory]     = useState([]);
  const [showTooltip, setShowTooltip] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // history at this point does NOT include the current message
    // We pass it to the backend as context for prior conversation
    const currentHistory = [...history];

    try {
      let reply;

      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 700));
        reply = getFallbackResponse(trimmed);
      } else {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 15000);

        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            // Send current message separately; history is prior context only
            body:    JSON.stringify({ message: trimmed, history: currentHistory }),
            signal:  controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          reply = data.reply || getFallbackResponse(trimmed);
        } catch (fetchErr) {
          clearTimeout(timeout);
          console.warn("Chat API unavailable, using fallback:", fetchErr.message);
          reply = getFallbackResponse(trimmed);
        }
      }

      // Now update history with the completed exchange
      // Strip the suggestions line from history to save tokens
      const { text: replyText } = parseMessage(reply);
      setHistory((prev) => [
        ...prev,
        { role: "user",      content: trimmed    },
        { role: "assistant", content: replyText  },
      ]);

      setMessages((prev) => [...prev, { role: "bot", text: reply, time: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "bot",
        text: "Sorry, something went wrong. 🌿\n\n💬 Quick replies: \"Try again\" | \"Call +91 7579189494\"",
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  };

  const fmtTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Initial quick replies shown before any user message
  const QUICK_REPLIES = [
    { label: "🛡️ Immunity herbs",  text: "What herbs help with immunity?" },
    { label: "😴 Stress & sleep",   text: "What do you recommend for stress and better sleep?" },
    { label: "🌿 Digestion",        text: "I have digestive issues, what should I take?" },
    { label: "✨ Skin problems",     text: "I have skin problems like acne" },
    { label: "📦 Delivery info",    text: "How does delivery work?" },
    { label: "💳 Payment options",  text: "What payment methods do you accept?" },
  ];

  return (
    <>
      <style>{`
        @keyframes chatPulse {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes chatFabPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .chat-window { animation: chatSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
        .chat-fab    { animation: chatFabPop  0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .quick-reply-btn:hover {
          background: #DCFCE7 !important;
          border-color: #15803D !important;
          color: #15803D !important;
        }
        .suggestion-chip:hover {
          background: #15803D !important;
          color: #fff !important;
        }
        .chat-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
        }
      `}</style>

      {/* ── Chat Window ── */}
      {open && (
        <div className="chat-window" style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 500,
          width: 384, height: 580,
          background: "#fff", borderRadius: 22,
          boxShadow: "0 24px 64px rgba(0,0,0,.18), 0 4px 16px rgba(21,128,61,.12)",
          display: "flex", flexDirection: "column",
          border: "1px solid rgba(21,128,61,.15)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#15803D 0%,#166534 100%)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,.18)",
                border: "2px solid rgba(255,255,255,.4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>🌿</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Priya · NaturaHeal</div>
                <div style={{ color: "#BBF7D0", fontSize: 11, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block", boxShadow: "0 0 6px #4ADE80" }} />
                  Online · Ayurvedic Consultant
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "50%", width: 32, height: 32, color: "#fff",
                cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
            >✕</button>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: 12,
            background: "#FAFAFA",
          }}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                fmtTime={fmtTime}
                onSuggestion={(text) => {
                  setInput("");
                  sendMessage(text);
                }}
              />
            ))}
            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Initial quick replies — shown only when no user messages yet */}
          {messages.length <= 1 && !loading && (
            <div style={{
              padding: "10px 14px 6px",
              display: "flex", gap: 6, flexWrap: "wrap",
              borderTop: "1px solid #F3F4F6",
              background: "#fff",
            }}>
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q.text}
                  className="quick-reply-btn"
                  onClick={() => { setInput(""); sendMessage(q.text); }}
                  style={{
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    color: "#374151", borderRadius: 14,
                    padding: "5px 10px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all .15s", fontFamily: "inherit",
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: "10px 12px 14px",
            display: "flex", gap: 8, alignItems: "center",
            borderTop: "1px solid #F3F4F6",
            background: "#fff",
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about our remedies…"
              disabled={loading}
              style={{
                flex: 1, padding: "10px 14px",
                border: "1.5px solid #E5E7EB", borderRadius: 22,
                fontSize: 13, outline: "none", fontFamily: "inherit",
                background: "#F9FAFB", transition: "border-color .2s",
                color: "#111827",
              }}
              onFocus={(e) => e.target.style.borderColor = "#15803D"}
              onBlur={(e)  => e.target.style.borderColor = "#E5E7EB"}
            />
            <button
              className="chat-send-btn"
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                background: !input.trim() || loading
                  ? "#E5E7EB"
                  : "linear-gradient(135deg,#15803D,#166534)",
                color: !input.trim() || loading ? "#9CA3AF" : "#fff",
                border: "none", borderRadius: "50%",
                width: 40, height: 40,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                fontSize: 16, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
                boxShadow: !input.trim() || loading ? "none" : "0 2px 8px rgba(21,128,61,.4)",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── FAB Button ── */}
      <button
        className="chat-fab"
        onClick={() => setOpen(!open)}
        title="Chat with Priya — our Ayurvedic consultant"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 500,
          width: 58, height: 58, borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg,#374151,#1F2937)"
            : "linear-gradient(135deg,#15803D,#166534)",
          color: "#fff", border: "none", cursor: "pointer",
          boxShadow: open
            ? "0 4px 20px rgba(55,65,81,.4)"
            : "0 4px 20px rgba(21,128,61,.5), 0 0 0 4px rgba(21,128,61,.12)",
          fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* ── Tooltip ── */}
      {!open && showTooltip && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 499,
          background: "#111827", color: "#fff",
          borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600,
          whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,.2)",
          animation: "chatSlideUp .3s ease both",
        }}>
          🌿 Chat with Priya — Ayurvedic Expert
          <div style={{
            position: "absolute", bottom: -5, right: 22,
            width: 10, height: 10, background: "#111827",
            transform: "rotate(45deg)", borderRadius: 2,
          }} />
        </div>
      )}
    </>
  );
}