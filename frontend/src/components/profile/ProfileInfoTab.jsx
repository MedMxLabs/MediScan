const GENDERS = ['', 'Male', 'Female', 'Other', 'Prefer not to say'];

const ProfileInfoTab = ({ p, setField, onSubmit, saving }) => (
  <div className="dash-inset p-6 sm:p-8 bg-slate-50/50 dark:bg-transparent">
    <h3 className="text-[16px] font-bold dash-text mb-8">Personal information</h3>
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label htmlFor="profile-name" className="dash-form-label">Full name</label>
        <input
          id="profile-name"
          type="text"
          value={p.name}
          onChange={(e) => setField('name', e.target.value)}
          className="dash-input"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-email" className="dash-form-label">Email</label>
        <input id="profile-email" type="email" value={p.email} readOnly className="dash-input-readonly" />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-phone" className="dash-form-label">Phone</label>
        <input
          id="profile-phone"
          type="text"
          value={p.phone}
          onChange={(e) => setField('phone', e.target.value)}
          placeholder="+91 98765 43210"
          className="dash-input"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-dob" className="dash-form-label">Date of birth</label>
        <input
          id="profile-dob"
          type="date"
          value={p.date_of_birth}
          onChange={(e) => setField('date_of_birth', e.target.value)}
          className="dash-input"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-gender" className="dash-form-label">Gender</label>
        <select
          id="profile-gender"
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
);

export default ProfileInfoTab;
