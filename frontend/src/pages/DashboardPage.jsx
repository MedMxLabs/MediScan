import { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { Link } from 'react-router-dom';

import { Bell, TrendingUp, Pill, IndianRupee, ArrowRight, MessageSquare, LayoutDashboard, Clock } from 'lucide-react';

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

  const { widgets, adherenceTrend, loading, recentSearches, remindersPreview, medicinesToday, cheapestPicks } =

    useSelector((state) => state.dashboard);

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

          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mt-3 overflow-hidden">

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



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <DashPanel title="Today's medicines" bodyClassName="space-y-3">

          {medicinesToday?.length ? (

            medicinesToday.map((m) => (

              <div key={m.id} className="dash-list-row flex items-center justify-between gap-3">

                <div>

                  <p className="font-bold dash-text">{m.medicine_name}</p>

                  <p className="text-xs dash-muted">{m.dose || 'Scheduled dose'}</p>

                </div>

                <span className="text-xs font-semibold text-teal tabular-nums inline-flex items-center gap-1">

                  <Clock size={14} />

                  {m.next_trigger?.replace('T', ' ').slice(11, 16) || '—'}

                </span>

              </div>

            ))

          ) : (

            <EmptyState

              title="Nothing scheduled today"

              description="Add reminders to see medicines due today."

              action={

                <Link to="/dashboard/reminders">

                  <Button variant="primary" size="sm">

                    Set reminders

                  </Button>

                </Link>

              }

            />

          )}

        </DashPanel>



        <DashPanel title="Upcoming reminders" bodyClassName="space-y-3">

          {remindersPreview?.length ? (

            remindersPreview.slice(0, 6).map((r) => (

              <div key={r.id} className="dash-list-row flex items-center justify-between gap-3">

                <div>

                  <p className="font-bold dash-text">{r.medicine_name}</p>

                  <p className="text-xs dash-muted">{r.dose || '—'}</p>

                </div>

                <span className="text-xs dash-muted tabular-nums">

                  {r.next_trigger?.replace('T', ' ').slice(0, 16) || '—'}

                </span>

              </div>

            ))

          ) : (

            <p className="text-sm dash-muted py-4">No active reminders yet.</p>

          )}

        </DashPanel>

      </div>



      {cheapestPicks?.length ? (

        <DashPanel title="Cheapest picks for you">

          <div className="flex flex-wrap gap-4">

            {cheapestPicks.map((pick, idx) => (

              <div

                key={`${pick.query}-${idx}`}

                className="w-full sm:w-auto sm:min-w-[260px] sm:max-w-sm flex-1 rounded-xl border border-teal/25 dark:border-teal/40 bg-teal/5 dark:bg-teal/10 p-4"

              >

                <p className="text-xs font-bold text-teal uppercase tracking-wide">Best price</p>

                <p className="font-extrabold dash-text mt-1 truncate">{pick.medicine || pick.query}</p>

                <p className="text-sm dash-muted mt-1">

                  {pick.pharmacy_name} · ₹{pick.price}

                </p>

                <div className="flex flex-wrap gap-3 mt-3">

                  {pick.url ? (

                    <a

                      href={pick.url}

                      target="_blank"

                      rel="noopener noreferrer"

                      className="text-xs dash-link"

                    >

                      Buy →

                    </a>

                  ) : null}

                  <Link

                    to={`/dashboard/compare?m=${encodeURIComponent(pick.query)}`}

                    className="text-xs dash-link"

                  >

                    Compare again

                  </Link>

                </div>

              </div>

            ))}

          </div>

        </DashPanel>

      ) : null}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <DashPanel

          className="lg:col-span-2"

          title="Recent searches"

          action={

            <Link to="/dashboard/search" className="text-xs sm:text-[13px] dash-link">

              Search medicines →

            </Link>

          }

          noPadding

          bodyClassName="p-0"

        >

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm min-w-[32rem]">

              <thead>

                <tr className="dash-table-head border-b">

                  <th className="px-5 py-3 font-bold dash-text">Medicine</th>

                  <th className="px-5 py-3 font-bold dash-text">When</th>

                  <th className="px-5 py-3 font-bold dash-text text-right">Action</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">

                {recentSearches?.length ? (

                  recentSearches.map((row, idx) => (

                    <tr key={idx} className="dash-row-hover transition-colors">

                      <td className="px-5 py-3.5 font-semibold dash-text">{row.query}</td>

                      <td className="px-5 py-3.5 dash-muted text-xs sm:text-sm tabular-nums">

                        {row.created_at?.replace('T', ' ').slice(0, 16) || '—'}

                      </td>

                      <td className="px-5 py-3.5 text-right">

                        <Link

                          to={`/dashboard/compare?m=${encodeURIComponent(row.query)}`}

                          className="text-xs dash-link"

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

            <p className="text-3xl font-extrabold dash-text tabular-nums">{widgets.adherenceScore}%</p>

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

                        border: '1px solid #475569',

                        backgroundColor: '#1e293b',

                        color: '#f1f5f9',

                        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',

                      }}

                      formatter={(value) => [`${value}%`, 'Score']}

                    />

                    <Line

                      type="monotone"

                      dataKey="score"

                      stroke="#2dd4bf"

                      strokeWidth={2.5}

                      dot={{ r: 3, fill: '#2dd4bf' }}

                      activeDot={{ r: 5 }}

                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <p className="text-sm dash-muted py-6 leading-relaxed">

                  Log doses from Reminders to see your trend.

                </p>

              )}

            </div>

          </DashPanel>



          <Link

            to="/dashboard/assistant"

            className="block dash-surface rounded-2xl p-5 sm:p-6 hover-lift hover:border-teal/40 transition-all group"

          >

            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="text-sm font-bold dash-text flex items-center gap-2">

                  <MessageSquare size={18} className="text-teal" />

                  AI Health Assistant

                </h3>

                <p className="text-sm dash-muted mt-2 leading-relaxed">

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

          className="text-xs sm:text-sm font-semibold dash-muted hover:text-red-500 dark:hover:text-red-400 dash-btn-secondary rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"

        >

          {resetting ? 'Resetting…' : 'Reset all activity data'}

        </button>

      </div>

    </PageShell>

  );

};



export default DashboardPage;


