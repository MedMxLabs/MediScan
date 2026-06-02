import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, updateProfile } from '../services/api';
import { applyTheme } from '../utils/theme';
import { saveWebNotifyPref } from '../utils/reminderNotifications';
import { updateProfile as updateReduxProfile } from '../store/slices/authSlice';
import { Settings } from 'lucide-react';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import LoadingState from '../components/dashboard/LoadingState';
import Button from '../components/ui/Button';

const tabs = ['Profile', 'Preferences', 'Notifications'];

const GENDERS = ['', 'Male', 'Female', 'Other', 'Prefer not to say'];

const emptyProfile = {
  email: '',
  name: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  preferences: {},
  notifications_enabled: true,
  email_digest: false,
  sms_alerts: false,
  theme: 'system',
};

const ProfileSettingsPage = () => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((s) => s.auth.user);
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ text: '', kind: '' });
  const [p, setP] = useState(emptyProfile);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setP({
          email: data?.email || reduxUser?.email || '',
          name: data?.name || '',
          phone: data?.phone || '',
          date_of_birth: data?.date_of_birth || '',
          gender: data?.gender || '',
          preferences: data?.preferences || {},
          notifications_enabled: Boolean(data?.notifications_enabled ?? true),
          email_digest: Boolean(data?.email_digest ?? false),
          sms_alerts: Boolean(data?.sms_alerts ?? false),
          theme: data?.preferences?.theme || 'system',
        });
        applyTheme(data?.preferences?.theme || localStorage.getItem('medscan_theme') || 'system');
      } catch (e) {
        setStatus({
          text: e.response?.data?.message || e.message || 'Could not load profile',
          kind: 'err',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [reduxUser?.email]);

  const setField = (k, v) => setP((prev) => ({ ...prev, [k]: v }));

  const save = async (partial, message = 'Saved.') => {
    setSaving(true);
    setStatus({ text: '', kind: '' });
    try {
      const data = await updateProfile(partial);
      setP((prev) => ({
        ...prev,
        ...partial,
        preferences: data?.preferences || prev.preferences,
      }));
      dispatch(
        updateReduxProfile({
          name: data?.name ?? partial.name ?? reduxUser?.name,
        }),
      );
      setStatus({ text: message, kind: 'ok' });
    } catch (e) {
      setStatus({
        text: e.response?.data?.message || e.message || 'Save failed',
        kind: 'err',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    save(
      {
        name: p.name.trim(),
        phone: p.phone.trim(),
        date_of_birth: p.date_of_birth.trim(),
        gender: p.gender,
      },
      'Profile updated.',
    );
  };

  const saveNotifications = () => {
    saveWebNotifyPref(p.notifications_enabled);
    return save(
      {
        notifications_enabled: p.notifications_enabled,
        email_digest: p.email_digest,
        sms_alerts: p.sms_alerts,
      },
      'Notification preferences saved.',
    );
  };

  const savePreferences = () => {
    applyTheme(p.theme);
    return save({ theme: p.theme }, 'Preferences saved.');
  };

  if (loading) return <LoadingState label="Loading profile…" />;

  const initials = (p.name || p.email || '?').slice(0, 1).toUpperCase();

  return (
    <PageShell className="max-w-5xl">
      <PageHeader title="Profile & settings" subtitle="Account details and notification preferences." icon={Settings} />

      <DashPanel noPadding bodyClassName="p-0">
      <div className="border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6">
        <nav className="-mb-px flex gap-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 text-[15px] whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-teal text-teal font-bold'
                  : 'border-b-2 border-transparent dash-muted hover:dash-text hover:border-slate-300 dark:hover:border-slate-600 font-medium'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {status.text && (
        <div
          className={`mx-4 sm:mx-6 mt-4 rounded-xl border px-4 py-3 text-sm ${
            status.kind === 'ok'
              ? 'border-teal/20 bg-teal/10 dark:bg-teal/15 text-teal-dark dark:text-teal'
              : 'border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-5 sm:p-6">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-[120px] h-[120px] bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden mb-5 text-5xl font-extrabold text-teal">
            {initials}
          </div>
          <h3 className="text-[20px] font-bold dash-text">{p.name || '—'}</h3>
          <p className="text-[14px] font-medium dash-muted mb-6 break-all text-center max-w-full">
            {p.email}
          </p>
        </div>

        <div className="md:col-span-8">
          {activeTab === 'Profile' && (
            <div className="dash-inset p-6 sm:p-8 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-[16px] font-bold dash-text mb-8">Personal information</h3>
              <form className="space-y-6" onSubmit={saveProfile}>
                <div className="space-y-2">
                  <label className="dash-form-label">Full name</label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="dash-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="dash-form-label">Email</label>
                  <input type="email" value={p.email} readOnly className="dash-input-readonly" />
                </div>
                <div className="space-y-2">
                  <label className="dash-form-label">Phone</label>
                  <input
                    type="text"
                    value={p.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="dash-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="dash-form-label">Date of birth</label>
                  <input
                    type="date"
                    value={p.date_of_birth}
                    onChange={(e) => setField('date_of_birth', e.target.value)}
                    className="dash-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="dash-form-label">Gender</label>
                  <select
                    value={p.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                    className="dash-input"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g || 'Select…'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-brand-gradient text-white text-[14px] font-bold py-2.5 px-6 rounded-xl shadow-sm hover:opacity-90 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'Preferences' && (
            <div className="dash-inset p-8 space-y-6">
              <h3 className="text-[16px] font-bold dash-text">System preferences</h3>
              <div className="space-y-2">
                <label className="dash-form-label">Theme</label>
                <select
                  value={p.theme}
                  onChange={(e) => setField('theme', e.target.value)}
                  className="dash-input max-w-xs"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <p className="text-sm dash-muted">
                Language and time zone: English · Asia/Kolkata (mobile app supports additional languages).
              </p>
              <Button type="button" onClick={savePreferences} disabled={saving}>
                {saving ? 'Saving…' : 'Save preferences'}
              </Button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="dash-inset p-6 sm:p-8 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-[16px] font-bold dash-text mb-6">
                Notification preferences
              </h3>

              <div className="space-y-4">
                {[
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
                ].map((row) => (
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
                <Button type="button" onClick={saveNotifications} disabled={saving}>
                  {saving ? 'Saving…' : 'Save preferences'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      </DashPanel>
    </PageShell>
  );
};

export default ProfileSettingsPage;
