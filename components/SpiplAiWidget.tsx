"use client";

import { useEffect, useRef, useState } from "react";

type ChatMsg = { from: "bot" | "user"; text: string };

// Simple keyword -> answer knowledge base. No external AI call needed —
// this is a fast, fully offline FAQ matcher scoped to the impactOne app.
const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["what is spipl ai", "who are you", "about you"],
    answer:
      "SPIPL AI is the AI Agent developed by SPIPL Tech™ which helps solve your queries regarding the impactOne app — you can ask me questions about check-ins, events, rewards, and more.",
  },
  {
    keywords: ["check in", "checkin", "where check in", "how to check in"],
    answer:
      "You have to check in while standing in front of the school — this helps us validate and verify your location quickly and accurately.",
  },
  {
    keywords: ["select event", "start event", "how to event", "record event"],
    answer:
      "After checking in, go to 'Start Event', select the event type, start recording, and then submit it.",
  },
  {
    keywords: ["how many event", "types of event", "which events"],
    answer:
      "There are 3 events: Student Session, Teacher Orientation, and Parent Meet.",
  },
  {
    keywords: ["parent meet at alc", "parent meeting alc center"],
    answer: "Yes, you can take a Parent Meet at the ALC center.",
  },
  {
    keywords: ["teacher orientation at alc", "teacher orientation alc center"],
    answer: "Yes, you can take Teacher Orientation at the ALC center.",
  },
  {
    keywords: ["parent meet at school", "parent meeting school"],
    answer: "Yes, you can take a Parent Meet at the school.",
  },
  {
    keywords: ["teacher orientation at school", "teacher orientation school"],
    answer: "Yes, you can take Teacher Orientation at the school.",
  },
  {
    keywords: ["combine", "teacher + parent", "teacher and parent", "combined event"],
    answer: "Yes, you can combine Teacher Orientation + Parent Meet into a single combined submission.",
  },
  {
    keywords: ["reward", "payment", "how much money", "how much rs", "rupees"],
    answer:
      "Rewards work in blocks of 2 completed schools:\n• 2 schools = ₹1500\n• 3 schools = ₹2500\n• 4 schools = ₹4000\nAmounts increase as you complete more schools — your DCU sends you a payment notification once you're eligible.",
  },
  {
    keywords: ["which class", "student session class", "class of students", "8th", "9th", "10th"],
    answer: "Student Sessions can be taken for 8th, 9th, 10th class students, or a Combine of these classes.",
  },
  {
    keywords: ["why event", "why are we doing", "mission", "purpose", "goal"],
    answer:
      "Our mission is simple — spread awareness about AI to everyone. Every check-in, session, and meeting you complete helps take that mission to more schools, teachers, students and parents.",
  },
  {
    keywords: ["reject", "rejected", "why rejected"],
    answer:
      "If your submission is rejected, your DCU will add a reason — check the History page to see exactly why, then you can resubmit correctly next time.",
  },
  {
    keywords: ["pending", "approve", "approval", "how long approve"],
    answer:
      "Once you submit a check-in or event, it goes to your DCU for approval. You can track the status (pending/approved/rejected) anytime on the History page.",
  },
  {
    keywords: ["bank details", "bank account", "payment eligible", "eligible for payment"],
    answer:
      "Once you become payment-eligible, your DCU sends you a notification — open it and fill in your bank details (account holder name, account number, IFSC, bank name). This isn't always mandatory depending on your district.",
  },
  {
    keywords: ["history", "my submissions", "what did i submit"],
    answer: "Go to the History tab in the bottom navigation — it shows everything you've submitted with date and time.",
  },
  {
    keywords: ["notification", "news", "notice"],
    answer:
      "Notifications, News, and Notice are all sent to you by your DCU — you'll find them from your home screen. Notifications are usually about your account/payments, News covers updates, and Notice covers important announcements.",
  },
  {
    keywords: ["intern", "difference alc intern", "am i alc or intern"],
    answer:
      "ALC and Intern both follow the same process — check in, complete events, and get schools approved. Bank details requirements may differ slightly depending on your district.",
  },
  {
    keywords: ["hello", "hi", "hey"],
    answer: "Hey! 👋 I'm SPIPL AI. Ask me anything about check-ins, events, rewards, or how the impactOne app works.",
  },
];

const QUICK_SUGGESTIONS = [
  "How to check in?",
  "How many events are there?",
  "How much rewards will I get?",
  "Can I combine teacher + parent?",
];

function findAnswer(question: string): string {
  const q = question.toLowerCase();
  let best: { score: number; answer: string } | null = null;

  for (const entry of FAQ) {
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        const score = kw.length;
        if (!best || score > best.score) {
          best = { score, answer: entry.answer };
        }
      }
    }
  }

  if (best) return best.answer;

  return "I'm not fully sure about that one yet — try asking about check-ins, events, rewards, or the app's mission. You can also raise a query to your DCU from the Queries option if you need a specific answer.";
}

export default function SpiplAiWidget() {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "bot", text: "Hi! I'm SPIPL AI 🤖 — ask me anything about check-ins, events, rewards or how this app works." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const role = d?.user?.role;
        setAllowed(role === "ALC" || role === "Intern");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question) return;
    setMessages((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: findAnswer(question) }]);
    }, 350);
  }

  if (!allowed) return null;

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open SPIPL AI chat"
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(78px + env(safe-area-inset-bottom))",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #f9723c 0%, #e0223a 100%)",
          boxShadow: "0 8px 20px rgba(224,34,58,0.4)",
          zIndex: 60,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: open ? "none" : "spiplBounce 2.4s ease-in-out infinite",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="none" />
          <circle className="spipl-eye" cx="14" cy="18" r="2.6" fill="#fff" />
          <circle className="spipl-eye" cx="26" cy="18" r="2.6" fill="#fff" />
          <path d="M13 25c2.5 3 11.5 3 14 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 12,
            left: 12,
            bottom: "calc(140px + env(safe-area-inset-bottom))",
            maxWidth: 380,
            marginLeft: "auto",
            marginRight: "auto",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
            overflow: "hidden",
            zIndex: 61,
            display: "flex",
            flexDirection: "column",
            maxHeight: "60vh",
            animation: "spiplPopIn 0.25s cubic-bezier(0.18,0.89,0.32,1.28)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #f9723c 0%, #e0223a 100%)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>SPIPL AI</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: 26,
                height: 26,
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
                  background: m.from === "bot" ? "#fdeeea" : "#e0223a",
                  color: m.from === "bot" ? "#1a1a1a" : "#fff",
                  padding: "9px 12px",
                  borderRadius: 14,
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  maxWidth: "82%",
                  whiteSpace: "pre-line",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 12px 10px" }}>
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontSize: 11.5,
                    padding: "6px 10px",
                    borderRadius: 20,
                    border: "1px solid #f0d5d0",
                    background: "#fff5f2",
                    color: "#e0223a",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #f0e4e2" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask SPIPL AI..."
              style={{
                flex: 1,
                border: "1px solid #eee",
                borderRadius: 20,
                padding: "8px 14px",
                fontSize: 13.5,
                outline: "none",
              }}
            />
            <button
              onClick={() => send()}
              style={{
                background: "#e0223a",
                border: "none",
                borderRadius: "50%",
                width: 34,
                height: 34,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spiplBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spiplPopIn {
          from { opacity: 0; transform: scale(0.85) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .spipl-eye {
          animation: spiplBlink 3.2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes spiplBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.15); }
        }
      `}</style>
    </>
  );
}