import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Newspaper, ChevronDown, Plus, Trash2, Pencil, GripVertical, Sparkles, Zap } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import ImageUpload from "@/pages/admin/ImageUpload";

const CATS = ["Article", "Blog", "Case Study"];
const field = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const EMPTY = { title: "", slug: "", category: "Article", excerpt: "", cover_image: "", tags: "", body: "", published: true, featured: false };

export default function BlogManager() {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null=none, {}=new, {id}=edit
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [ap, setAp] = useState(null);
  const [running, setRunning] = useState(false);
  const dragIndex = useRef(null);

  const load = () => api.get("/admin/blog").then(({ data }) => setPosts(data.posts)).catch(() => {});
  const loadAp = () => api.get("/admin/blog-autopilot").then(({ data }) => setAp(data)).catch(() => {});
  useEffect(() => { if (open) { load(); loadAp(); } }, [open]);

  const saveAp = async (patch) => {
    try { const { data } = await api.put("/admin/blog-autopilot", patch); setAp(data); toast.success("Autopilot updated"); }
    catch { toast.error("Could not update autopilot"); }
  };
  const runAp = async () => {
    setRunning(true);
    try {
      const { data } = await api.post("/admin/blog-autopilot/run");
      toast.success(`Post created: ${data.title}`);
      load(); loadAp();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Generation failed — try again");
    } finally { setRunning(false); }
  };

  const reorder = async (from, to) => {
    if (from == null || from === to) return;
    const next = [...posts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPosts(next);
    try { await api.put("/admin/blog/reorder", { ids: next.map((x) => x.id) }); toast.success("Order saved"); }
    catch { toast.error("Could not save order"); load(); }
  };

  const startNew = () => { setForm(EMPTY); setEditing({}); };
  const startEdit = (p) => {
    setForm({ ...p, tags: (p.tags || []).join(", "), body: (p.body || []).join("\n\n") });
    setEditing({ id: p.id });
  };

  const save = async () => {
    if (!form.title) return toast.error("Title is required");
    setSaving(true);
    const payload = {
      title: form.title, slug: form.slug || undefined, category: form.category,
      excerpt: form.excerpt, cover_image: form.cover_image, published: form.published, featured: form.featured,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      body: form.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    };
    try {
      if (editing.id) await api.put(`/admin/blog/${editing.id}`, payload);
      else await api.post("/admin/blog", payload);
      toast.success("Post saved");
      setEditing(null); load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Save failed");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.delete(`/admin/blog/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div data-testid="blog-manager" className="mt-8 rounded-2xl border border-line bg-white p-6">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between" data-testid="blog-manager-toggle">
        <span className="flex items-center gap-2 font-heading font-bold"><Newspaper className="h-4 w-4 text-brand" /> Blog &amp; insights</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-6">
          {!editing ? (
            <>
              {ap && (
                <div data-testid="blog-autopilot" className="mb-6 rounded-xl border border-brand/20 bg-brand/[0.03] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-heading font-bold text-sm"><Sparkles className="h-4 w-4 text-brand" /> Blog Autopilot — auto-draft SEO posts</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input data-testid="autopilot-enabled" type="checkbox" checked={!!ap.enabled} onChange={(e) => saveAp({ enabled: e.target.checked })} className="h-4 w-4 accent-[#0055FF]" />
                      {ap.enabled ? "On" : "Off"}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Writes a fresh, keyword-targeted post automatically and pings search engines. Runs on the schedule below when On.</p>
                  <div className="mt-4 flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-1 text-xs font-mono uppercase tracking-wide text-muted-foreground">
                      Frequency
                      <select data-testid="autopilot-frequency" value={ap.frequency_days} onChange={(e) => saveAp({ frequency_days: Number(e.target.value) })} className={`${field} w-40`}>
                        <option value={7}>Weekly</option>
                        <option value={14}>Every 2 weeks</option>
                        <option value={30}>Monthly</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm pb-2">
                      <input data-testid="autopilot-auto-publish" type="checkbox" checked={!!ap.auto_publish} onChange={(e) => saveAp({ auto_publish: e.target.checked })} className="h-4 w-4 accent-[#0055FF]" />
                      Publish automatically (off = save as draft)
                    </label>
                    <button data-testid="autopilot-run" onClick={runAp} disabled={running} className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-brand transition-colors disabled:opacity-50">
                      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} {running ? "Writing…" : "Generate a post now"}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-t border-brand/10 pt-3" data-testid="autopilot-status">
                    <span>Next topic: <span className="text-ink/70">{ap.next_topic}</span></span>
                    <span>Generated so far: <span className="text-ink/70">{ap.generated_count || 0}</span></span>
                    <span>Last run: <span className="text-ink/70">{ap.last_run ? new Date(ap.last_run).toLocaleString() : "never"}</span></span>
                    {ap.enabled && ap.next_run && <span>Next scheduled: <span className="text-ink/70">{new Date(ap.next_run).toLocaleString()}</span></span>}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{posts.length} post(s)</p>
                <button data-testid="blog-new" onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-ink transition-colors"><Plus className="h-4 w-4" /> New post</button>
              </div>
              <div className="mt-4 divide-y divide-line border border-line rounded-xl">
                {posts.map((p, idx) => (
                  <div key={p.id} data-testid={`blog-row-${p.slug}`}
                    draggable onDragStart={() => { dragIndex.current = idx; }}
                    onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(dragIndex.current, idx)}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink/30" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · /{p.slug} · {p.published ? "published" : "draft"}{p.featured ? " · ★ featured" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(p)} data-testid={`blog-edit-${p.slug}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:border-ink"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(p.id)} data-testid={`blog-delete-${p.slug}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-red-600 hover:border-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"><GripVertical className="h-3.5 w-3.5" /> Drag rows to reorder posts.</p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input data-testid="blog-field-title" className={field} placeholder="Title" value={form.title} onChange={setF("title")} />
                <input data-testid="blog-field-slug" className={field} placeholder="slug (auto if blank)" value={form.slug} onChange={setF("slug")} />
                <select data-testid="blog-field-category" className={field} value={form.category} onChange={setF("category")}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input data-testid="blog-field-tags" className={field} placeholder="Tags (comma separated)" value={form.tags} onChange={setF("tags")} />
                <input data-testid="blog-field-excerpt" className={`${field} sm:col-span-2`} placeholder="Excerpt / summary" value={form.excerpt} onChange={setF("excerpt")} />
                <div className="sm:col-span-2">
                  <ImageUpload testid="blog-cover-upload" label="Cover image" value={form.cover_image} onChange={(v) => setForm((f) => ({ ...f, cover_image: v }))} />
                </div>
              </div>
              <textarea data-testid="blog-field-body" rows={10} className={field} placeholder="Body — separate paragraphs with a blank line" value={form.body} onChange={setF("body")} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={setF("published")} className="h-4 w-4 accent-[#0055FF]" /> Published</label>
              <label className="flex items-center gap-2 text-sm"><input data-testid="blog-field-featured" type="checkbox" checked={form.featured} onChange={setF("featured")} className="h-4 w-4 accent-[#0055FF]" /> Featured (pin to top of blog &amp; homepage)</label>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(null)} className="rounded-full border border-line px-5 py-2 text-sm hover:border-ink">Cancel</button>
                <button data-testid="blog-save" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-ink transition-colors disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save post</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
