import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, Save } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";

const field = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function ChangePassword() {
  const [f, setF] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (f.new_password.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (f.new_password !== f.confirm) { toast.error("New passwords do not match"); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: f.current_password, new_password: f.new_password });
      toast.success("Password changed — use the new one next time you log in");
      setF({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Password change failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="mt-8 rounded-2xl border border-line bg-white p-6" data-testid="change-password-card">
      <p className="flex items-center gap-2 font-heading font-bold"><KeyRound className="h-4 w-4 text-brand" /> Change admin password</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input data-testid="cp-current" type="password" autoComplete="current-password" className={field} value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} placeholder="Current password" />
        <input data-testid="cp-new" type="password" autoComplete="new-password" className={field} value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} placeholder="New password (min 8 characters)" />
        <input data-testid="cp-confirm" type="password" autoComplete="new-password" className={field} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} placeholder="Confirm new password" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button data-testid="cp-save" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-brand transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save new password
        </button>
        <p className="text-[11px] text-muted-foreground">Takes effect immediately and survives restarts. Your current login session stays active.</p>
      </div>
    </div>
  );
}
