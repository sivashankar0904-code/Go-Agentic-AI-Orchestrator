import { useState, useEffect } from "react";

const API_URL = "http://localhost:8001/api/v1/chat/";

const SERVICES = [
  { label: "mock_service_2", sub: "CSV",   url: "http://localhost:8002/api/v1/messages/" },
  { label: "mock_service_3", sub: "Excel", url: "http://localhost:8003/api/v1/messages/" },
  { label: "mock_service_4", sub: "PDF",   url: "http://localhost:8004/api/v1/messages/" },
];

function useMessages(url) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus]     = useState("connecting");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) { setMessages(data.messages ?? []); setStatus("online"); }
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    poll();
    const id = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [url]);

  return { messages, status };
}

function ServicePanel({ label, sub, url }) {
  const { messages, status } = useMessages(url);

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>{label}</span>
        <span style={{ ...styles.badge, background: status === "online" ? "#22c55e" : status === "offline" ? "#ef4444" : "#f59e0b" }}>
          {status}
        </span>
      </div>
      <div style={styles.panelSub}>{sub} messages</div>
      <div style={styles.messageList}>
        {messages.length === 0
          ? <span style={styles.empty}>No messages yet</span>
          : [...messages].reverse().map((m, i) => (
              <div key={i} style={styles.message}>{m.message ?? JSON.stringify(m)}</div>
            ))
        }
      </div>
    </div>
  );
}

export default function App() {
  const [fileType, setFileType] = useState("CSV");
  const [message,  setMessage]  = useState("");
  const [reply,    setReply]    = useState(null);
  const [error,    setError]    = useState(null);
  const [sending,  setSending]  = useState(false);

  async function send() {
    if (!message.trim()) return;
    setSending(true); setReply(null); setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `[${fileType}] ${message}` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReply(data.reply);
      setMessage("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>Agentic AI Orchestrator</h1>

      <div style={styles.sendBox}>
        <select value={fileType} onChange={e => setFileType(e.target.value)} style={styles.select}>
          {["CSV", "Excel", "PDF"].map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button style={styles.button} onClick={send} disabled={sending}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      {reply && <div style={styles.reply}>✅ {reply}</div>}
      {error && <div style={styles.err}>❌ {error}</div>}

      <div style={styles.grid}>
        {SERVICES.map(s => <ServicePanel key={s.label} {...s} />)}
      </div>
    </div>
  );
}

const styles = {
  root:        { fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 },
  title:       { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  sendBox:     { display: "flex", gap: 8, marginBottom: 12 },
  select:      { padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  input:       { flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  button:      { padding: "8px 20px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 },
  reply:       { padding: "8px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, marginBottom: 12, fontSize: 14 },
  err:         { padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, marginBottom: 12, fontSize: 14 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 },
  panel:       { border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#f9fafb" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  panelTitle:  { fontWeight: 600, fontSize: 14 },
  panelSub:    { fontSize: 12, color: "#6b7280", marginBottom: 12 },
  badge:       { fontSize: 11, color: "#fff", padding: "2px 8px", borderRadius: 99 },
  messageList: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" },
  message:     { padding: "6px 10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 },
  empty:       { fontSize: 13, color: "#9ca3af" },
};
