import { Download, Check } from 'lucide-react';
import Button from '../ui/Button';

const PreferencesTab = ({ theme, onThemeChange, onSave, saving, pwa }) => {
  const { canInstall, install, isStandalone } = pwa;

  return (
    <div className="dash-inset p-8 space-y-6">
      <h3 className="text-[16px] font-bold dash-text">System preferences</h3>
      <div className="space-y-2">
        <label htmlFor="profile-theme" className="dash-form-label">Theme</label>
        <select
          id="profile-theme"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
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
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save preferences'}
      </Button>

      <div className="border-t border-slate-100 dark:border-slate-700 pt-6 mt-2">
        <h3 className="text-[16px] font-bold dash-text mb-1">Install app</h3>
        <p className="text-sm dash-muted mb-4">
          Add MedMx LABS to your home screen for faster access and an app-like experience.
        </p>
        {isStandalone ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/10 px-4 py-2.5 text-sm font-semibold text-teal-dark dark:text-teal">
            <Check size={16} /> App installed
          </span>
        ) : canInstall ? (
          <Button type="button" onClick={() => install()}>
            <span className="inline-flex items-center gap-2">
              <Download size={16} /> Install MedMx LABS
            </span>
          </Button>
        ) : (
          <p className="text-sm dash-muted">
            Open the browser menu and choose <strong>Install app</strong> / <strong>Add to Home screen</strong>.
            On iPhone, use Share → Add to Home Screen.
          </p>
        )}
      </div>
    </div>
  );
};

export default PreferencesTab;
