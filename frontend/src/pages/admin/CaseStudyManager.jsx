import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, LineChart, ChevronDown, Plus, Trash2, Pencil, GripVertical, Eye } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import ImageUpload from "@/pages/admin/ImageUpload";

const CATS = ["SEO", "AI", "Web", "Marketing", "App"];
const field = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const EMPTY = {
  title: "", slug: "", category: "Web", tag: "", metric: "", metricLabel: "",
  industry: "", region: "", duration: "", year: "", cover: "", og: "", excerpt: "",
  challenge: "", approach: "", results: "", services: "", stack: "",
  chartLabel: "", chartBefore: "", chartAfter: "", chartSuffix: "", chartPrefix: "", chartHigher: true,
  quoteText: "", quoteName: "", quoteRole: "", published: true, order: 100,
};

// approach textarea format: "Heading | text" per line. results: "value | label" per line.
function parsePairs(text, keys) {
  return (text || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [a, ...rest] = l.split("|");
    return { [keys[0]]: (a || "").trim(), [keys[1]]: rest.join("|").trim() };
  });
}
const joinPairs = (arr, keys) => (arr || []).map((o) => `${o[keys[0]] || ""} | ${o[keys[1]] || ""}`).join("\n");

export default function CaseStudyManager() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const dragIndex = useRef(null);

  const load = () => api.get("/admin/case-studies").then(({ data }) => setItems(data.items)).catch(() => {});
  useEffect(() => { if (open) load(); }, [open]);

  const reorder = async (from, to) => {
    if (from == null || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    try { await api.put("/admin/case-studies/reorder", { ids: next.map((x) => x.id) }); toast.success("Order saved"); }
    catch { toast.error("Could not save order"); load(); }
  };

  const startNew = () => { setForm(EMPTY); setEditing({}); };
  const startEdit = (c) => {
    const ch = c.chart || {};
    setForm({
      ...EMPTY, ...c,
      approach: joinPairs(c.approach, ["h", "t"]),
      results: joinPairs(c.results, ["value", "label"]),
      services: (c.services || []).join(", "),
      stack: (c.stack || []).join(", "),
      chartLabel: ch.label || "", chartBefore: ch.before ?? "", chartAfter: ch.after ?? "",
      chartSuffix: ch.suffix || "", chartPrefix: ch.prefix || "", chartHigher: ch.higherIsBetter !== false,
      quoteText: c.quote?.text || "", quoteName: c.quote?.name || "", quoteRole: c.quote?.role || "",
    });
    setEditing({ id: c.id });
  };

  const save = async () => {
    if (!form.title) return toast.error("Title is required");
    setSaving(true);
    const payload = {
      title: form.title, slug: form.slug || undefined, category: form.category, tag: form.tag,
      metric: form.metric, metricLabel: form.metricLabel, industry: form.industry, region: form.region,
      duration: form.duration, year: String(form.year), cover: form.cover, og: form.og, excerpt: form.excerpt,
      challenge: form.challenge, published: form.published, order: Number(form.order) || 100,
      approach: parsePairs(form.approach, ["h", "t"]),
      results: parsePairs(form.results, ["value", "label"]),
      services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
      stack: form.stack.split(",").map((s) => s.trim()).filter(Boolean),
      quote: { text: form.quoteText, name: form.quoteName, role: form.quoteRole },
      chart: form.chartLabel ? {
        label: form.chartLabel, before: Number(form.chartBefore) || 0, after: Number(form.chartAfter) || 0,
        suffix: form.chartSuffix, prefix: form.chartPrefix, higherIsBetter: !!form.chartHigher,
      } : null,
    };
    try {
      if (editing.id) await api.put(`/admin/case-studies/${editing.id}`, payload);
      else await api.post("/admin/case-studies", payload);
      toast.success("Case study saved");
      setEditing(null); load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Save failed");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this case study?")) return;
    try { await api.delete(`/admin/case-studies/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div data-testid="case-study-manager" className="mt-8 rounded-2xl border border-line bg-white p-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between" data-testid="case-manager-toggle">
        <span className="flex items-center gap-2 font-heading font-bold"><LineChart className="h-4 w-4 text-brand" /> Case studies</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-6">
          {!editing ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{items.length} case study(ies)</p>
                <button data-testid="case-new" onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-ink transition-colors"><Plus className="h-4 w-4" /> New case study</button>
              </div>
              <div className="mt-4 divide-y divide-line border border-line rounded-xl">
                {items.map((c, idx) => (
                  <div key={c.id} data-testid={`case-row-${c.slug}`}
                    draggable onDragStart={() => { dragIndex.current = idx; }}
                    onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(dragIndex.current, idx)}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink/30" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate"><span className="text-brand font-bold">{c.metric}</span> · {c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.category} · /{c.slug} · {c.published ? "published" : "draft"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(c)} data-testid={`case-edit-${c.slug}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:border-ink"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(c.id)} data-testid={`case-delete-${c.slug}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-red-600 hover:border-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"><GripVertical className="h-3.5 w-3.5" /> Drag rows to reorder how they appear on the site.</p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input data-testid="case-field-title" className={field} placeholder="Title" value={form.title} onChange={setF("title")} />
                <input className={field} placeholder="slug (auto if blank)" value={form.slug} onChange={setF("slug")} />
                <select className={field} value={form.category} onChange={setF("category")}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                <input className={field} placeholder="Tag (e.g. SEO · GEO)" value={form.tag} onChange={setF("tag")} />
                <input data-testid="case-field-metric" className={field} placeholder="Metric (e.g. 3×, +52%)" value={form.metric} onChange={setF("metric")} />
                <input className={field} placeholder="Metric label" value={form.metricLabel} onChange={setF("metricLabel")} />
                <input className={field} placeholder="Industry" value={form.industry} onChange={setF("industry")} />
                <input className={field} placeholder="Region" value={form.region} onChange={setF("region")} />
                <input className={field} placeholder="Duration" value={form.duration} onChange={setF("duration")} />
                <input className={field} placeholder="Year" value={form.year} onChange={setF("year")} />
                <input className={field} placeholder="Services (comma slugs)" value={form.services} onChange={setF("services")} />
                <input className={field} placeholder="Stack / tags (comma)" value={form.stack} onChange={setF("stack")} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <ImageUpload testid="case-cover-upload" label="Cover image" value={form.cover} onChange={(v) => setForm((f) => ({ ...f, cover: v }))} />
                <ImageUpload testid="case-og-upload" label="OG share image" value={form.og} onChange={(v) => setForm((f) => ({ ...f, og: v }))} />
              </div>
              <textarea className={field} rows={2} placeholder="Excerpt / summary" value={form.excerpt} onChange={setF("excerpt")} />
              <textarea className={field} rows={3} placeholder="The challenge" value={form.challenge} onChange={setF("challenge")} />
              <textarea data-testid="case-field-approach" className={field} rows={4} placeholder="Approach — one per line as: Heading | description" value={form.approach} onChange={setF("approach")} />
              <textarea data-testid="case-field-results" className={field} rows={4} placeholder="Results — one per line as: value | label" value={form.results} onChange={setF("results")} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={field} placeholder="Quote text" value={form.quoteText} onChange={setF("quoteText")} />
                <input className={field} placeholder="Quote author" value={form.quoteName} onChange={setF("quoteName")} />
                <input className={field} placeholder="Quote role" value={form.quoteRole} onChange={setF("quoteRole")} />
                <input className={field} type="number" placeholder="Sort order" value={form.order} onChange={setF("order")} />
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Before / after chart (optional)</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input className={`${field} sm:col-span-3`} placeholder="Chart label" value={form.chartLabel} onChange={setF("chartLabel")} />
                  <input className={field} type="number" placeholder="Before" value={form.chartBefore} onChange={setF("chartBefore")} />
                  <input className={field} type="number" placeholder="After" value={form.chartAfter} onChange={setF("chartAfter")} />
                  <input className={field} placeholder="Suffix (e.g. %)" value={form.chartSuffix} onChange={setF("chartSuffix")} />
                  <input className={field} placeholder="Prefix (e.g. $)" value={form.chartPrefix} onChange={setF("chartPrefix")} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.chartHigher} onChange={setF("chartHigher")} className="h-4 w-4 accent-[#0055FF]" /> Higher is better</label>
                </div>
              </div>
              {showPreview && (
                <div data-testid="case-preview" className="rounded-2xl border border-brand/30 bg-paper p-4">
                  <p className="mb-3 text-xs font-mono uppercase tracking-wide text-brand">Live preview — as visitors will see it</p>
                  <div className="overflow-hidden rounded-2xl border border-line bg-white max-w-sm">
                    <div className="relative aspect-[16/10] bg-ink/5">
                      {form.cover && <img src={form.cover} alt="cover" className="h-full w-full object-cover" />}
                      {form.tag && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">{form.tag}</span>}
                    </div>
                    <div className="p-5">
                      <p className="font-heading text-4xl font-extrabold tracking-tighter text-brand">{form.metric || "—"}</p>
                      <p className="text-xs text-ink/55">{form.metricLabel}</p>
                      <h3 className="mt-3 font-heading text-lg font-bold tracking-tight leading-snug">{form.title || "Untitled case study"}</h3>
                      <p className="mt-2 text-sm text-ink/60 line-clamp-3">{form.excerpt}</p>
                    </div>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={setF("published")} className="h-4 w-4 accent-[#0055FF]" /> Published</label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowPreview((v) => !v)} data-testid="case-preview-toggle" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-sm hover:border-ink"><Eye className="h-4 w-4" /> {showPreview ? "Hide preview" : "Preview"}</button>
                <button onClick={() => setEditing(null)} className="rounded-full border border-line px-5 py-2 text-sm hover:border-ink">Cancel</button>
                <button data-testid="case-save" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-ink transition-colors disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save case study</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
