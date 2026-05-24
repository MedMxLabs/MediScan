import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Bell, TrendingUp, Pill, IndianRupee, ArrowRight, MessageSquare, LayoutDashboard } from 'lucide-react';
import { setDashboardData, setLoading, setError, resetDashboard } from '../store/slices/dashboardSlice';
import { resetMedicine } from '../store/slices/medicineSlice';
import { resetReminders } from '../store/slices/reminderSlice';
import { resetReports } from '../store/slices/reportSlice';
import { getDashboardData, resetUserActivity } from '../services/api';
import RefillAlertsBanner from '../components/RefillAlertsBanner';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import DashPanel from '../components/dashboard/DashPanel';
import LoadingState from '../components/dashboard/LoadingState';
import EmptyState from '../components/dashboard/EmptyState';
import Button from '../components/ui/Button';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { widgets, adherenceTrend, loading, recentSearches } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      dispatch(setLoading(true));
      try {
        const data = await getDashboardData();
        dispatch(setDashboardData(data));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchDashboard();
  }, [dispatch]);

  const handleResetAll = async () => {
    if (
      !window.confirm(
        'Clear all your MedMx LABS activity? This removes searches, uploads, reminders, adherence logs, and lab reports. Your account stays.',
      )
    ) {
      return;
    }
    setResetting(true);
    dispatch(setLoading(true));
    try {
      await resetUserActivity();
      dispatch(resetDashboard());
      dispatch(resetMedicine());
      dispatch(resetReminders());
      dispatch(resetReports());
      const data = await getDashboardData({ refresh: true });
      dispatch(setDashboardData(data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
      setResetting(false);
    }
  };

  const firstName = user?.name?.split?.(' ')?.[0] || user?.email?.split?.('@')?.[0] || 'there';

  if (loading) {
    return <LoadingState label="Loading your overview…" />;
  }

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here's your health overview at a glance."
        icon={LayoutDashboard}
      />

      <RefillAlertsBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Upcoming reminders" value={widgets.upcomingReminders} sub="Due today" icon={Bell} />
        <StatCard
          label="Adherence score"
          value={`${widgets.adherenceScore}%`}
          sub={
            widgets.adherenceScore >= 80
              ? 'On track'
              : widgets.adherenceScore > 0
                ? 'Keep building'
                : 'Log doses in Reminders'
          }
          accent="teal"
          icon={TrendingUp}
        >
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-brand-gradient rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, widgets.adherenceScore)}%` }}
            />
          </div>
        </StatCard>
        <StatCard label="Medicines tracked" value={widgets.medicinesTracked} sub="Active" icon={Pill} />
        <StatCard
          label="Money saved"
          value={`₹${widgets.monthlySavings}`}
          sub="This month"
          accent="teal"
          icon={IndianRupee}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashPanel
          className="lg:col-span-2"
          title="Recent searches"
          action={
            <Link
              to="/dashboard/search"
              className="text-xs sm:text-[13px] font-bold text-teal hover:text-teal-dark transition-colors"
            >
              Search medicines →
            </Link>
          }
          noPadding
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[32rem]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-100">
                  <th className="px-5 py-3 font-bold text-navy">Medicine</th>
                  <th className="px-5 py-3 font-bold text-navy">When</th>
                  <th className="px-5 py-3 font-bold text-navy text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSearches?.length ? (
                  recentSearches.map((row, idx) => (
                    <tr key={idx} className="hover:bg-teal/[0.03] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-navy">{row.query}</td>
                      <td className="px-5 py-3.5 text-muted text-xs sm:text-sm tabular-nums">
                        {row.created_at?.replace('T', ' ').slice(0, 16) || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/dashboard/compare?m=${encodeURIComponent(row.query)}`}
                          className="text-xs font-bold text-teal hover:underline"
                        >
                          Compare again
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState
                        title="No searches yet"
                        description="Run a live price search across six pharmacies — results show up here."
                        action={
                          <Link to="/dashboard/search">
                            <Button variant="primary" size="sm">
                              Search medicine
                            </Button>
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashPanel>

        <div className="space-y-6 flex flex-col">
          <DashPanel title="Adherence this week" bodyClassName="pb-4">
            <p className="text-3xl font-extrabold text-navy tabular-nums">{widgets.adherenceScore}%</p>
            <div className="h-40 sm:h-44 mt-4 -mx-1">
              {adherenceTrend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adherenceTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px -8px rgba(10,25,47,0.15)',
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00a896"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#00a896' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted py-6">Log doses from Reminders to see your trend.</p>
              )}
            </div>
          </DashPanel>

          <Link
            to="/dashboard/assistant"
            className="block rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-sm hover-lift hover:border-teal/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  <MessageSquare size={18} className="text-teal" />
                  AI Health Assistant
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Ask about medicines, side effects, or lab results — informational only.
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
          className="text-xs sm:text-sm font-semibold text-muted hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset all activity data'}
        </button>
      </div>
    </PageShell>
  );
};

export default DashboardPage;
