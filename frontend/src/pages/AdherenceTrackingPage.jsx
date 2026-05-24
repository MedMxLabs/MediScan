import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import { getAdherence, getReminders, markDose } from '../services/api';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import LoadingState from '../components/dashboard/LoadingState';

const COLORS = ['bg-teal/100', 'bg-navy-light', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];

function seriesFromWeekly(weekly) {
  if (!Array.isArray(weekly)) return [];
  return weekly.map((row) => {
    const total = (row.taken || 0) + (row.missed || 0);
    const score = total > 0 ? Math.round((100 * row.taken) / total) : 0;
    return { name: (row.date || '').slice(5), score };
  });
}

const AdherenceTrackingPage = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [adherence, setAdherence] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [marking, setMarking] = useState(null);

  const refresh = async () => {
    try {
      const [adh, rem] = await Promise.all([
        getAdherence(),
        getReminders().catch(() => []),
      ]);
      setAdherence(adh || {});
      setReminders(Array.isArray(rem) ? rem : []);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Could not load adherence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const perMedicine = useMemo(() => {
    const logs = adherence?.logs || [];
    const byRid = {};
    logs.forEach((l) => {
      const k = l.reminder_id;
      if (!byRid[k]) byRid[k] = { taken: 0, missed: 0 };
      byRid[k][l.status] = (byRid[k][l.status] || 0) + 1;
    });
    const nameOf = {};
    reminders.forEach((r) => {
      nameOf[r.id] = r.medicine_name;
    });
    return Object.entries(byRid)
      .map(([rid, v], i) => {
        const total = (v.taken || 0) + (v.missed || 0);
        const score = total > 0 ? Math.round((100 * v.taken) / total) : 0;
        return {
          id: rid,
          name: nameOf[rid] || `Reminder #${rid}`,
          score,
          color: COLORS[i % COLORS.length],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [adherence, reminders]);

  const chartData = useMemo(() => seriesFromWeekly(adherence?.weekly_series), [adherence]);

  const handleMark = async (reminder, status) => {
    setMarking(`${reminder.id}:${status}`);
    try {
      await markDose(reminder.id, status);
      await refresh();
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Mark failed');
    } finally {
      setMarking(null);
    }
  };

  if (loading) return <LoadingState label="Loading adherence…" />;

  const pct = Number(adherence?.completion_percent ?? 0);
  const taken = adherence?.taken_doses ?? 0;
  const missed = adherence?.missed_doses ?? 0;
  const total = adherence?.total_logged ?? 0;

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Adherence tracking"
        subtitle="Mark doses taken or missed — charts update from your logs."
        icon={TrendingUp}
      />

      {err && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-teal/10 to-white">
            <Card.Body className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Adherence</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-teal">{pct}%</span>
                <span className="text-sm font-medium text-teal-dark bg-teal/10 px-2 py-0.5 rounded">
                  Lifetime
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Doses Taken</span>
                  <span className="font-bold text-gray-900">{taken}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Doses Missed</span>
                  <span className="font-bold text-red-500">{missed}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Total Logged</span>
                  <span className="font-bold text-gray-900">{total}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-bold text-gray-900">Per-medicine adherence</h3>
            </Card.Header>
            <Card.Body className="space-y-6">
              {perMedicine.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No logged doses yet. Mark reminders taken below to populate.
                </p>
              ) : (
                perMedicine.map((med) => (
                  <div key={med.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 truncate pr-4">{med.name}</span>
                      <span className="font-bold text-gray-900">{med.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${med.color} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${med.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[300px] flex flex-col">
            <Card.Header>
              <h3 className="text-lg font-bold text-gray-900">Weekly trend</h3>
              <p className="text-sm text-gray-500">Taken vs missed, last 7 days</p>
            </Card.Header>
            <Card.Body className="flex-1 min-h-0 pt-6">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00a896"
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 7, fill: '#00a896', stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 px-2">
                  Log some doses to see your weekly trend here.
                </p>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-bold text-gray-900">Log today's doses</h3>
              <p className="text-sm text-gray-500">
                Mark each active reminder so adherence stays accurate.
              </p>
            </Card.Header>
            <Card.Body>
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No active reminders. Add reminders from the Reminders page to log doses here.
                </p>
              ) : (
                <div className="space-y-3">
                  {reminders.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 rounded-xl p-3"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{r.medicine_name}</p>
                        <p className="text-xs text-gray-500">
                          {[r.dose, r.frequency].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={marking === `${r.id}:taken`}
                          onClick={() => handleMark(r, 'taken')}
                          className="text-[12px] font-bold bg-brand-gradient hover:opacity-90 text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          Mark taken
                        </button>
                        <button
                          type="button"
                          disabled={marking === `${r.id}:missed`}
                          onClick={() => handleMark(r, 'missed')}
                          className="text-[12px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          Missed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default AdherenceTrackingPage;
