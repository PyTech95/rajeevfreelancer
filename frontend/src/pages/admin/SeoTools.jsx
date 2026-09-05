import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Radar, Share2, ChevronDown, Clock } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { SERVICES } from "@/data/site";
import { getSiteConfig, canonicalBase } from "@/lib/siteConfig";

function useIndexNow() {
  const [state, setState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paths, setPaths] = useState("/\n/services\n/contact");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/admin/indexnow").then(({ data }) => setState(data)).catch(() => {});
  }, []);

  const toggle = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/admin/indexnow", { enabled: !state.enabled });
      setState((prev) => ({ ...prev, ...data }));
      toast.success(data.enabled ? "IndexNow enabled" : "IndexNow disabled");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    const list = paths.split("\n").map((p) => p.trim()).filter(Boolean);
    if (!list.length) return toast.error("Add at least one path");
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/indexnow/submit", { paths: list });
      toast.success(`Submitted ${data.submitted} URL(s) — IndexNow status ${data.status}`);
      try {
        const { data: fresh } = await api.get("/admin/indexnow");
        setState(fresh);
      } catch { /* keep prior state */ }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return { state, saving, toggle, paths, setPaths, submit, submitting };
}

const field = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleString();
  } catch { return iso; }
}

function SocialPreview() {
  const cfg = getSiteConfig();
  const base = canonicalBase();
  const [path, setPath] = useState("/");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ title: cfg.seo.default_title, description: cfg.seo.default_description, image: cfg.seo.og_image });

  const resolve = async () => {
    setLoading(true);
    try {
      const clean = "/" + path.replace(/^\/+/, "").replace(/\/+$/, "");
      const segs = clean.split("/").filter(Boolean);
      const c = getSiteConfig();
      let next = { title: c.seo.default_title, description: c.seo.default_description, image: c.seo.og_image };
      if (segs.length === 2 && SERVICES.some((s) => s.slug === segs[0])) {
        const { data } = await api.get(`/page/${segs[0]}/${segs[1]}`);
        next = { title: data.content.title, description: data.content.meta_description, image: c.seo.og_image };
      } else if (segs.length === 1 && SERVICES.some((s) => s.slug === segs[0])) {
        const svc = SERVICES.find((s) => s.slug === segs[0]);
        next = { title: `${svc.name} — Hire Rajeev Worldwide | ${c.seo.site_name}`, description: svc.tagline, image: c.seo.og_image };
      }
      setMeta(next);
    } catch {
      toast.error("Could not resolve that path");
    } finally {
      setLoading(false);
    }
  };

  const host = base.replace(/^https?:\/\//, "");
  const url = `${base}${path.startsWith("/") ? path : "/" + path}`;

  return (
    <div className="mt-8">
      <p className="flex items-center gap-2 text-sm font-heading font-bold text-ink/80"><Share2 className="h-4 w-4 text-brand" /> Social share preview</p>
      <p className="mt-1 text-xs text-muted-foreground">See how a page looks when shared. Try a city page like <code>/freelance-seo-expert/dubai-uae</code>.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <input data-testid="preview-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/path" className={`${field} max-w-md`} />
        <button data-testid="preview-resolve" onClick={resolve} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-ink transition-colors disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Preview
        </button>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-5" data-testid="preview-cards">
        {/* LinkedIn */}
        <div className="rounded-xl border border-line overflow-hidden bg-white">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-muted-foreground border-b border-line">LinkedIn</div>
          <img src={meta.image} alt="" className="w-full aspect-[1.91/1] object-cover bg-paper" />
          <div className="p-3">
            <p className="text-[11px] uppercase text-muted-foreground">{host}</p>
            <p className="mt-1 font-semibold text-sm leading-snug line-clamp-2">{meta.title}</p>
          </div>
        </div>
        {/* X / Twitter */}
        <div className="rounded-xl border border-line overflow-hidden bg-white">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-muted-foreground border-b border-line">X (Twitter)</div>
          <div className="rounded-2xl border border-line m-3 overflow-hidden">
            <img src={meta.image} alt="" className="w-full aspect-[1.91/1] object-cover bg-paper" />
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">{host}</p>
              <p className="mt-1 font-semibold text-sm leading-snug line-clamp-1">{meta.title}</p>
              <p className="mt-1 text-xs text-ink/60 line-clamp-2">{meta.description}</p>
            </div>
          </div>
        </div>
        {/* WhatsApp */}
        <div className="rounded-xl border border-line overflow-hidden bg-[#e5ddd5]">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-muted-foreground border-b border-line bg-white">WhatsApp</div>
          <div className="p-3">
            <div className="rounded-lg overflow-hidden bg-white shadow-sm max-w-[85%]">
              <img src={meta.image} alt="" className="w-full aspect-[1.91/1] object-cover bg-paper" />
              <div className="p-2.5">
                <p className="font-semibold text-[13px] leading-snug line-clamp-2">{meta.title}</p>
                <p className="mt-1 text-[11px] text-ink/55 line-clamp-2">{meta.description}</p>
                <p className="mt-1 text-[11px] text-ink/40">{host}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink/50 break-all">{url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeoTools() {
  const [open, setOpen] = useState(false);
  const { state, saving, toggle, paths, setPaths, submit, submitting } = useIndexNow();

  return (
    <div data-testid="seo-tools" className="mt-8 rounded-2xl border border-line bg-white p-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between" data-testid="seo-tools-toggle">
        <span className="flex items-center gap-2 font-heading font-bold"><Radar className="h-4 w-4 text-brand" /> SEO tools — IndexNow &amp; social preview</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-6">
          {/* IndexNow */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-heading font-bold text-ink/80"><Radar className="h-4 w-4 text-brand" /> IndexNow — auto-notify search engines</p>
              {state && (
                <label className="flex items-center gap-2 text-sm">
                  <input data-testid="indexnow-enabled" type="checkbox" checked={state.enabled} onChange={toggle} disabled={saving} className="h-4 w-4 accent-[#0055FF]" />
                  {state.enabled ? "Enabled" : "Disabled"}
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">New city pages are auto-submitted when they go live. Verification key served at <code>/api/indexnow-key</code>. Live pings only succeed from your production domain.</p>
            <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wide text-muted-foreground">
                Manually submit paths (one per line)
                <textarea data-testid="indexnow-paths" rows={3} value={paths} onChange={(e) => setPaths(e.target.value)} className={field} />
              </label>
              <button data-testid="indexnow-submit" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-ink transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit
              </button>
            </div>

            {state?.last_ping ? (
              <div data-testid="indexnow-status" className="mt-4 rounded-xl border border-line bg-paper/60 p-4">
                <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Last notification sent</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span data-testid="indexnow-last-result" className={`inline-flex items-center gap-1.5 font-medium ${state.last_ping.ok ? "text-green-600" : "text-amber-600"}`}>
                    <span className={`h-2 w-2 rounded-full ${state.last_ping.ok ? "bg-green-500" : "bg-amber-500"}`} />
                    {state.last_ping.ok ? "Delivered" : `HTTP ${state.last_ping.status || "error"}`}
                  </span>
                  <span className="text-ink/70">{state.last_ping.count} URL(s)</span>
                  <span className="text-muted-foreground" data-testid="indexnow-last-time">{fmtTime(state.last_ping.at)}</span>
                </div>
                {!state.last_ping.ok && (
                  <p className="mt-1.5 text-xs text-muted-foreground">A non-success code is expected on the preview URL — live pings verify only from your production domain after deploy.</p>
                )}
                {state.history?.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer select-none text-xs font-medium text-brand">Recent pings ({state.history.length})</summary>
                    <ul className="mt-2 space-y-1.5 text-xs" data-testid="indexnow-history">
                      {state.history.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.ok ? "bg-green-500" : "bg-amber-500"}`} />
                          <span className="shrink-0 tabular-nums text-muted-foreground">{fmtTime(h.at)}</span>
                          <span className="shrink-0 text-ink/70">{h.count} URL · {h.ok ? "OK" : `HTTP ${h.status || "err"}`}</span>
                          <span className="truncate text-ink/45">{(h.urls || []).join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : (
              <p data-testid="indexnow-status-empty" className="mt-4 text-xs text-muted-foreground">No notifications sent yet — publish or edit a city page, blog post or case study, or submit paths above, to see the delivery status here.</p>
            )}
          </div>

          <div className="my-6 h-px bg-line" />
          <SocialPreview />
        </div>
      )}
    </div>
  );
}
