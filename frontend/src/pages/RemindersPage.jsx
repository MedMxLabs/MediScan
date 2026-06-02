import { useEffect, useState } from 'react';
import {
  Bell,
  Clock,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import {
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
} from '../services/api';
import {
  ensureNotificationPermission,
  loadWebNotifyPref,
  scheduleWebReminderNotifications,
} from '../utils/reminderNotifications';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import LoadingState from '../components/dashboard/LoadingState';
import DashPanel from '../components/dashboard/DashPanel';
import EmptyState from '../components/dashboard/EmptyState';

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'thrice_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
];

const emptyForm = {
  medicine_name: '',
  dose: '',
  frequency: 'once_daily',
  duration_days: 7,
  times: '09:00',
};

function toViewModel(r) {
  return {
    id: r.id,
    raw: r,
    name: r.medicine_name,
    dose: r.dose || '',
    time: r.next_trigger ? String(r.next_trigger).slice(11, 16) : '—',
    schedule:
      r.frequency ||
      (r.schedule?.times ? `Times: ${r.schedule.times.join(', ')}` : '—'),
    duration: r.duration_days ? `${r.duration_days}d` : null,
    active: r.enabled ?? r.status === 'active',
  };
}

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const data = await getReminders();
      const list = Array.isArray(data) ? data : [];
      const views = list.map(toViewModel);
      setReminders(views);
      if (loadWebNotifyPref()) {
        scheduleWebReminderNotifications(views);
      }
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Could not load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.medicine_name.trim()) {
      setErr('Medicine name required');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const times = form.times
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await createReminder({
        medicine_name: form.medicine_name.trim(),
        dose: form.dose.trim() || null,
        frequency: form.frequency,
        duration_days: Number(form.duration_days) || null,
        times,
        schedule: { times },
      });
      if (loadWebNotifyPref() && 'Notification' in window && Notification.permission === 'default') {
        await ensureNotificationPermission();
      }
      resetForm();
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (r) => {
    const nextStatus = r.active ? 'paused' : 'active';
    setReminders((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)),
    );
    try {
      await updateReminder({ id: r.id, status: nextStatus });
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Update failed');
      load();
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete reminder for ${r.name}?`)) return;
    setReminders((prev) => prev.filter((x) => x.id !== r.id));
    try {
      await deleteReminder(r.id);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Delete failed');
      load();
    }
  };

  if (loading) return <LoadingState label="Loading reminders…" />;

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title="Reminders & schedule"
        subtitle="Manage medicine reminders and refill windows."
        icon={Bell}
        action={
          <Button variant="primary" className="gap-2 shrink-0" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Close' : 'Add reminder'}
          </Button>
        }
      />

      {err && (
        <div className="rounded-xl dash-alert-error px-4 py-3 text-sm">
          {err}
        </div>
      )}

      {showForm && (
        <DashPanel title="New reminder">
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="dash-form-label mb-1">
                  Medicine name
                </label>
                <input
                  type="text"
                  required
                  value={form.medicine_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, medicine_name: e.target.value }))
                  }
                  className="dash-input py-2.5"
                  placeholder="e.g. Metformin 500mg"
                />
              </div>
              <div>
                <label className="dash-form-label mb-1">Dose</label>
                <input
                  type="text"
                  value={form.dose}
                  onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
                  className="dash-input py-2.5"
                  placeholder="1 tablet"
                />
              </div>
              <div>
                <label className="dash-form-label mb-1">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="dash-input py-2.5 bg-white"
                >
                  {FREQUENCIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="dash-form-label mb-1">
                  Times (HH:MM, comma-sep)
                </label>
                <input
                  type="text"
                  value={form.times}
                  onChange={(e) => setForm((f) => ({ ...f, times: e.target.value }))}
                  className="dash-input py-2.5"
                  placeholder="09:00, 21:00"
                />
              </div>
              <div>
                <label className="dash-form-label mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration_days: e.target.value }))
                  }
                  className="dash-input py-2.5"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  <Check size={16} className="mr-1" />
                  {saving ? 'Saving…' : 'Create reminder'}
                </Button>
              </div>
            </form>
        </DashPanel>
      )}

      <div className="grid gap-4">
        {reminders.map((reminder) => (
          <Card
            key={reminder.id}
            className={`transition-all ${
              reminder.active
                ? 'border-teal/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-75'
            }`}
          >
            <Card.Body className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    reminder.active ? 'bg-teal/10 text-teal' : 'bg-slate-200 dark:bg-slate-700 dash-muted'
                  }`}
                >
                  <Bell size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      reminder.active ? 'dash-text' : 'dash-muted'
                    }`}
                  >
                    {reminder.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1.5 text-sm dash-muted font-medium">
                      <Clock size={14} className="opacity-60" />
                      {reminder.time}
                    </span>
                    <span className="text-xs dash-muted dash-surface px-2 py-0.5 rounded-full">
                      {reminder.schedule}
                    </span>
                    {reminder.dose && (
                      <span className="text-xs dash-muted">{reminder.dose}</span>
                    )}
                    {reminder.duration && (
                      <span className="text-xs dash-muted">{reminder.duration}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                <button
                  className="p-2 dash-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  onClick={() => handleDelete(reminder)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <button
                  onClick={() => handleToggle(reminder)}
                  className={`flex items-center gap-2 font-medium transition-colors ${
                    reminder.active ? 'text-teal' : 'dash-muted'
                  }`}
                >
                  {reminder.active ? (
                    <>
                      On <ToggleRight size={32} className="text-teal" />
                    </>
                  ) : (
                    <>
                      Off <ToggleLeft size={32} className="dash-muted" />
                    </>
                  )}
                </button>
              </div>
            </Card.Body>
          </Card>
        ))}

        {reminders.length === 0 && (
          <EmptyState
            icon={Bell}
            title="No reminders yet"
            description="Set schedules so we can nudge you before doses run out."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Create first reminder
              </Button>
            }
          />
        )}
      </div>
    </PageShell>
  );
};

export default RemindersPage;
