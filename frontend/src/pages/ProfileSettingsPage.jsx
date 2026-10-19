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
import ProfileInfoTab from '../components/profile/ProfileInfoTab';
import PreferencesTab from '../components/profile/PreferencesTab';
import NotificationsTab from '../components/profile/NotificationsTab';
import usePwaInstall from '../hooks/usePwaInstall';
import useAsync, { errorMessage } from '../hooks/useAsync';

const tabs = ['Profile', 'Preferences', 'Notifications'];

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
  const pwa = usePwaInstall();
  const [activeTab, setActiveTab] = useState('Profile');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ text: '', kind: '' });
  const [p, setP] = useState(emptyProfile);

  const { data: loaded, loading, error: loadError } = useAsync(async () => {
    const data = await getProfile();
    return {
      form: {
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
      },
      theme: data?.preferences?.theme || localStorage.getItem('medscan_theme') || 'system',
    };
  }, [reduxUser?.email]);

  useEffect(() => {
    if (!loaded) return;
    setP(loaded.form);
    applyTheme(loaded.theme);
  }, [loaded]);

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
      setStatus({ text: errorMessage(e, 'Save failed'), kind: 'err' });
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

  if (loading && !loaded) return <LoadingState label="Loading profile…" />;

  const initials = (p.name || p.email || '?').slice(0, 1).toUpperCase();
  const shown =
    status.text || !loadError ? status : { text: errorMessage(loadError, 'Could not load profile'), kind: 'err' };

  return (
    <PageShell className="max-w-5xl">
      <PageHeader title="Profile & settings" subtitle="Account details and notification preferences." icon={Settings} />

      <DashPanel noPadding bodyClassName="p-0">
      <div className="border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6">
        <nav className="-mb-px flex gap-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
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

      {shown.text && (
        <div
          role={shown.kind === 'err' ? 'alert' : 'status'}
          className={`mx-4 sm:mx-6 mt-4 rounded-xl border px-4 py-3 text-sm ${
            shown.kind === 'ok'
              ? 'border-teal/20 bg-teal/10 dark:bg-teal/15 text-teal-dark dark:text-teal'
              : 'border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'
          }`}
        >
          {shown.text}
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
            <ProfileInfoTab p={p} setField={setField} onSubmit={saveProfile} saving={saving} />
          )}
          {activeTab === 'Preferences' && (
            <PreferencesTab
              theme={p.theme}
              onThemeChange={(v) => setField('theme', v)}
              onSave={savePreferences}
              saving={saving}
              pwa={pwa}
            />
          )}
          {activeTab === 'Notifications' && (
            <NotificationsTab p={p} setField={setField} onSave={saveNotifications} saving={saving} />
          )}
        </div>
      </div>
      </DashPanel>
    </PageShell>
  );
};

export default ProfileSettingsPage;
