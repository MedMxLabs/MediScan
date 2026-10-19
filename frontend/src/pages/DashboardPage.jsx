import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, LayoutDashboard } from 'lucide-react';
import { getDashboardData, resetUserActivity } from '../services/api';
import useAsync, { errorMessage } from '../hooks/useAsync';
import RefillAlertsBanner from '../components/RefillAlertsBanner';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import LoadingState from '../components/dashboard/LoadingState';
import DashboardStats from '../components/dashboard/DashboardStats';
import SchedulePanels from '../components/dashboard/SchedulePanels';
import CheapestPicksPanel from '../components/dashboard/CheapestPicksPanel';
import RecentSearchesPanel from '../components/dashboard/RecentSearchesPanel';
import AdherenceTrendPanel from '../components/dashboard/AdherenceTrendPanel';

const EMPTY_WIDGETS = { upcomingReminders: 0, adherenceScore: 0, medicinesTracked: 0, monthlySavings: 0 };

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const { data, loading, error } = useAsync(() => getDashboardData({ refresh: refreshKey > 0 }), [refreshKey]);

  const handleResetAll = async () => {
    if (
      !window.confirm(
        'Clear all your MedMx LABS activity? This removes searches, uploads, reminders, adherence logs, and lab reports. Your account stays.',
      )
    ) {
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      await resetUserActivity();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setResetError(e);
    } finally {
      setResetting(false);
    }
  };

  const firstName = user?.name?.split?.(' ')?.[0] || user?.email?.split?.('@')?.[0] || 'there';

  if (loading || resetting) {
    return <LoadingState label="Loading your overview…" />;
  }

  const widgets = data?.widgets || EMPTY_WIDGETS;
  const shownError = resetError || error;

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here's your health overview at a glance."
        icon={LayoutDashboard}
      />

      {shownError && (
        <div className="rounded-xl dash-alert-error px-4 py-3 text-sm" role="alert">
          {errorMessage(shownError, 'Could not load your overview.')}
        </div>
      )}

      <RefillAlertsBanner />

      <DashboardStats widgets={widgets} />

      <SchedulePanels medicinesToday={data?.medicinesToday} remindersPreview={data?.remindersPreview} />

      <CheapestPicksPanel picks={data?.cheapestPicks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentSearchesPanel className="lg:col-span-2" searches={data?.recentSearches} />

        <div className="space-y-6 flex flex-col">
          <AdherenceTrendPanel score={widgets.adherenceScore} trend={data?.adherenceTrend} />

          <Link
            to="/dashboard/assistant"
            className="block dash-surface rounded-2xl p-5 sm:p-6 hover-lift hover:border-teal/40 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold dash-text flex items-center gap-2">
                  <MessageSquare size={18} className="text-teal" />
                  Help Assistant
                </h3>
                <p className="text-sm dash-muted mt-2 leading-relaxed">
                  Get quick answers about search, prescriptions, reminders, and lab reports.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand group-hover:scale-105 transition-transform">
                <ArrowRight size={18} />
              </span>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleResetAll}
          disabled={resetting}
          className="text-xs sm:text-sm font-semibold dash-muted hover:text-red-500 dark:hover:text-red-400 dash-btn-secondary rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset all activity data'}
        </button>
      </div>
    </PageShell>
  );
};

export default DashboardPage;
