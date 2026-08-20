import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, ChevronDown, Trash2, Phone, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { renderChatText } from "@/lib/chatText";

const waNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const WA_TEXT = "Hi! This is Rajeev. Thanks for chatting with Jeny on my website — happy to help you further.";

export default function ChatManager() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/admin/chats").then(({ data }) => setSessions(data.sessions)).catch(() => toast.error("Could not load chats")).finally(() => setLoading(false));
  };
  useEffect(() => { if (open) load(); }, [open]);

  const select = (sid) => {
    setSelected(sid);
    setDetail(null);
    api.get(`/admin/chats/${sid}`).then(({ data }) => setDetail(data)).catch(() => toast.error("Could not load chat"));
  };

  const remove = async (sid) => {
    if (!window.confirm("Delete this chat conversation?")) return;
    try {
      await api.delete(`/admin/chats/${sid}`);
      toast.success("Chat deleted");
      if (selected === sid) { setSelected(null); setDetail(null); }
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div data-testid="chat-manager" className="mt-8 rounded-2xl border border-line bg-white p-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between" data-testid="chat-manager-toggle">
        <span className="flex items-center gap-2 font-heading font-bold">
          <MessageCircle className="h-4 w-4 text-brand" /> Jeny chat conversations
          {sessions.length > 0 && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-mono text-brand">{sessions.length}</span>}
        </span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Every conversation visitors have with Jeny — with their WhatsApp number when shared.</p>
            <button onClick={load} data-testid="chat-refresh" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {loading && !sessions.length ? (
            <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : sessions.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No chat conversations yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              {/* Session list */}
              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <button key={s.session_id} onClick={() => select(s.session_id)} data-testid={`chat-session-${s.session_id}`}
                    className={`w-full rounded-xl border p-3.5 text-left transition-colors ${selected === s.session_id ? "border-brand bg-brand/5" : "border-line hover:border-ink/40"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.phone_captured ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        <Phone className="h-3 w-3" /> {s.phone_captured ? (s.phone.startsWith("+") ? s.phone : `+${waNumber(s.phone)}`) : "No number yet"}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{s.message_count} msg</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-ink">
                      {(s.visitor_name || s.budget) && (
                        <span className="font-semibold">{[s.visitor_name, s.budget && `Budget: ${s.budget}`].filter(Boolean).join(" · ")} — </span>
                      )}
                      {s.last_message || "—"}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                      {new Date(s.updated_at).toLocaleString()} · {s.page || "/"}
                    </p>
                  </button>
                ))}
              </div>

              {/* Transcript */}
              <div className="rounded-xl border border-line bg-paper">
                {!selected ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">Select a conversation to read the full transcript.</p>
                ) : !detail ? (
                  <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
                ) : (
                  <div className="flex h-full max-h-[480px] flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-3 rounded-t-xl">
                      <div>
                        <p className="text-sm font-semibold">
                          {detail.visitor_name || (detail.phone_captured ? detail.phone : "Visitor (no number shared)")}
                          {detail.visitor_name && detail.phone_captured && <span className="ml-2 font-normal text-muted-foreground">{detail.phone}</span>}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Started {new Date(detail.created_at).toLocaleString()}{detail.budget ? ` · Budget: ${detail.budget}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {detail.phone_captured && (
                          <a href={`https://wa.me/${waNumber(detail.phone)}?text=${encodeURIComponent(WA_TEXT)}`}
                            target="_blank" rel="noopener noreferrer" data-testid="chat-whatsapp-btn"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                            <Phone className="h-3.5 w-3.5" /> Chat on WhatsApp
                          </a>
                        )}
                        <button onClick={() => remove(detail.session_id)} data-testid="chat-delete-btn" aria-label="Delete chat"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2.5 overflow-y-auto p-4" data-testid="chat-transcript">
                      {detail.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-white"}`}>
                            <p className="whitespace-pre-wrap">{renderChatText(m.text, m.role === "user")}</p>
                            <p className={`mt-1 font-mono text-[9px] ${m.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                              {m.role === "user" ? "Visitor" : "Jeny"} · {new Date(m.ts).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
