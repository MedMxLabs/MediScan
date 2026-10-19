import Button from '../ui/Button';

const ROWS = [
  {
    key: 'notifications_enabled',
    title: 'Medicine reminders',
    desc: 'Receive daily alerts to take your medicines.',
  },
  {
    key: 'email_digest',
    title: 'Weekly email digest',
    desc: 'Adherence summary and refill alerts on your email.',
  },
  {
    key: 'sms_alerts',
    title: 'SMS alerts',
    desc: 'Critical reminders and refill warnings via SMS.',
  },
];

const NotificationsTab = ({ p, setField, onSave, saving }) => (
  <div className="dash-inset p-6 sm:p-8 bg-slate-50/50 dark:bg-transparent">
    <h3 className="text-[16px] font-bold dash-text mb-6">Notification preferences</h3>

    <div className="space-y-4">
      {ROWS.map((row) => (
        <label
          key={row.key}
          className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
        >
          <div>
            <h4 className="text-[14px] font-bold dash-text">{row.title}</h4>
            <p className="text-[13px] dash-muted mt-0.5">{row.desc}</p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(p[row.key])}
            onChange={(e) => setField(row.key, e.target.checked)}
            className="h-5 w-9 accent-teal"
          />
        </label>
      ))}
    </div>

    <div className="pt-6">
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save preferences'}
      </Button>
    </div>
  </div>
);

export default NotificationsTab;
