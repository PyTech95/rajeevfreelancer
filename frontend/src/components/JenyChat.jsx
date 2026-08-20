import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Volume2, VolumeX, Bot, Mic, MicOff, PhoneCall } from "lucide-react";
import { API } from "@/lib/api";
import { renderChatText } from "@/lib/chatText";

const GREETING = "Hi! I'm Jeny — Rajeev's AI assistant. How can I help you today?";
const CHIPS = [
  "What services does Rajeev offer?",
  "How much does a website cost?",
  "Can you help with SEO?",
  "I need an app built",
];

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

const getSid = () => {
  let sid = localStorage.getItem("jeny_sid");
  if (!sid) {
    sid = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem("jeny_sid", sid);
  }
  return sid;
};

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return (
    voices.find((v) => /female|zira|samantha|victoria|karen|tessa|jenny|aria/i.test(v.name) && v.lang.startsWith("en")) ||
    voices.find((v) => v.lang.startsWith("en")) || null
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" data-testid="jeny-typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function JenyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("jeny_muted") === "1");
  const [greeted, setGreeted] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const openRef = useRef(false);
  const voiceModeRef = useRef(false);
  const recRef = useRef(null);
  const sendRef = useRef(null);
  openRef.current = open;
  voiceModeRef.current = voiceMode;

  const speak = useCallback((text, onEnd) => {
    if (localStorage.getItem("jeny_muted") === "1") { onEnd?.(); return; }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
      u.rate = 1;
      u.pitch = 1.05;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      window.speechSynthesis.speak(u);
    } catch { onEnd?.(); }
  }, []);

  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SR || recRef.current || !openRef.current) return;
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let final = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setInput(final || interim);
      };
      rec.onend = () => {
        recRef.current = null;
        setListening(false);
        const text = final.trim();
        if (text) { setInput(""); sendRef.current?.(text); }
      };
      rec.onerror = (e) => {
        recRef.current = null;
        setListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setVoiceMode(false);
          localStorage.removeItem("jeny_voice");
        }
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
      localStorage.setItem("jeny_voice", "1");
    } catch { setListening(false); }
  }, []);

  const toggleVoiceMode = () => {
    if (voiceMode) {
      setVoiceMode(false);
      localStorage.removeItem("jeny_voice");
      stopListening();
      window.speechSynthesis?.cancel();
    } else {
      setVoiceMode(true);
      startListening();
    }
  };

  // Load history for returning visitors
  useEffect(() => {
    const sid = getSid();
    fetch(`${API}/chat/history/${sid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) {
          setMessages(d.messages.map((m) => ({ role: m.role, text: m.text })));
          setGreeted(true);
        }
      })
      .catch(() => {});
  }, []);

  const greet = useCallback(() => {
    setGreeted((g) => {
      if (!g) {
        setMessages((ms) => (ms.length ? ms : [{ role: "assistant", text: GREETING }]));
        speak("Hi, I am Jeny, Rajeev's AI assistant. How can I help you?");
      }
      return true;
    });
  }, [speak]);

  // Auto pop-up after 15 seconds (once per browser session)
  useEffect(() => {
    if (sessionStorage.getItem("jeny_auto")) return;
    const t = setTimeout(() => {
      if (!openRef.current) {
        sessionStorage.setItem("jeny_auto", "1");
        setOpen(true);
        greet();
      }
    }, 15000);
    return () => clearTimeout(t);
  }, [greet]);

  // Mic auto-on when chat opens for visitors who used voice before
  useEffect(() => {
    if (open && SR && localStorage.getItem("jeny_voice") === "1" && !voiceModeRef.current) {
      setVoiceMode(true);
      const t = setTimeout(startListening, 600);
      return () => clearTimeout(t);
    }
    if (!open) { stopListening(); window.speechSynthesis?.cancel(); }
  }, [open, startListening, stopListening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("jeny_muted", next ? "1" : "0");
    if (next) window.speechSynthesis?.cancel();
  };

  const openChat = () => {
    sessionStorage.setItem("jeny_auto", "1");
    setOpen(true);
    greet();
  };

  const send = async (textArg) => {
    const text = (typeof textArg === "string" ? textArg : input).trim();
    if (!text || busy) return;
    stopListening();
    setInput("");
    setBusy(true);
    setMessages((ms) => [...ms, { role: "user", text }, { role: "assistant", text: "" }]);
    let acc = "";
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSid(), message: text, page: window.location.pathname }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const p of parts) {
          if (!p.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(p.slice(6));
            if (d.delta) {
              acc += d.delta;
              setMessages((ms) => {
                const next = [...ms];
                next[next.length - 1] = { role: "assistant", text: next[next.length - 1].text + d.delta };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch {
      acc = "Sorry, I couldn't connect. You can reach Rajeev on WhatsApp at +91 97116 23561.";
      setMessages((ms) => {
        const next = [...ms];
        next[next.length - 1] = { role: "assistant", text: acc };
        return next;
      });
    } finally {
      setBusy(false);
      // Voice conversation loop: speak the reply, then auto-reopen the mic
      if (voiceModeRef.current && acc) {
        speak(acc, () => { if (voiceModeRef.current && openRef.current) startListening(); });
      }
    }
  };
  sendRef.current = send;

  const showChips = messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {/* Floating bubble (bottom-left, opposite of call/WhatsApp buttons) */}
      <AnimatePresence>
        {!open && (
          <motion.button type="button" onClick={openChat} data-testid="jeny-bubble" aria-label="Chat with Jeny, Rajeev's AI assistant"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-full bg-ink text-white p-3 sm:pl-4 sm:pr-5 sm:py-3 shadow-lg shadow-black/25">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand">
              <Bot className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-ink animate-pulse" />
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-sm font-semibold">Chat with Jeny</span>
              <span className="block text-[10px] text-white/60">Rajeev's AI assistant · Online</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div data-testid="jeny-panel"
            initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 left-5 z-[70] flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
            style={{ height: "min(560px, calc(100vh - 6rem))" }}>
            {/* Header */}
            <div className="flex items-center justify-between bg-ink px-4 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand">
                  <Sparkles className="h-5 w-5" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-ink" />
                </span>
                <div className="leading-tight">
                  <p className="font-heading text-sm font-bold">Jeny</p>
                  <p className="text-[10px] text-white/60">
                    {listening ? "Listening… speak now" : "Rajeev's AI assistant · replies instantly"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleMute} data-testid="jeny-mute" aria-label={muted ? "Unmute voice" : "Mute voice"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={() => setOpen(false)} data-testid="jeny-close" aria-label="Close chat"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-3.5 py-4" data-testid="jeny-messages">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div data-testid={`jeny-message-${m.role}`}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-white text-ink"
                    }`}>
                    {m.text ? renderChatText(m.text, m.role === "user") : (busy && i === messages.length - 1 ? <Typing /> : "")}
                  </div>
                </div>
              ))}
              {showChips && messages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1" data-testid="jeny-chips">
                  {CHIPS.map((c) => (
                    <button key={c} onClick={() => send(c)} disabled={busy}
                      className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-50">
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Book a call */}
            <div className="flex justify-center border-t border-line bg-white px-3 pt-2">
              <button type="button" data-testid="jeny-book-call"
                onClick={() => window.dispatchEvent(new Event("rf-open-call"))}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand/5 border border-brand/20 px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-colors">
                <PhoneCall className="h-3.5 w-3.5" /> Book a call with Rajeev
              </button>
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-line bg-white p-3">
              {SR && (
                <button type="button" onClick={toggleVoiceMode} data-testid="jeny-mic"
                  aria-label={voiceMode ? "Turn off voice conversation" : "Talk with your voice"}
                  title={voiceMode ? "Voice conversation on — tap to stop" : "Talk with your voice"}
                  className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    voiceMode ? "bg-red-500 text-white" : "border border-line text-ink hover:border-brand hover:text-brand"
                  }`}>
                  {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {listening && <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />}
                </button>
              )}
              <input data-testid="jeny-input" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening… speak now" : "Type your message…"} disabled={busy}
                className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand disabled:opacity-60" />
              <button type="submit" data-testid="jeny-send" disabled={busy || !input.trim()} aria-label="Send message"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-ink transition-colors disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
