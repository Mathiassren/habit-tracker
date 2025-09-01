"use client";

import { useState } from "react";

export default function ChatBox() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a concise, helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data?.ok ? data.text : "Sorry, I couldn’t answer that.",
        },
      ]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: "Network error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <div className="border rounded p-3 h-80 overflow-y-auto text-sm space-y-2">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span className="inline-block rounded px-3 py-2 border">
                <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
              </span>
            </div>
          ))}
        {loading && <div className="opacity-60">AI is typing…</div>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
        />
        <button
          className="border rounded px-4 py-2"
          onClick={send}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
