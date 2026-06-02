import { useEffect, useState } from 'react';
import { Search, FileText, Calendar, ExternalLink, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getHistory, getHistoryAnalytics } from '../services/api';
import { Link } from 'react-router-dom';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import LoadingState from '../components/dashboard/LoadingState';
import EmptyState from '../components/dashboard/EmptyState';
import Button from '../components/ui/Button';

const MedicineHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [data, stats] = await Promise.all([
          getHistory(),
          getHistoryAnalytics().catch(() => null),
        ]);
        setAnalytics(stats);
        const rows = [];
        (data.searches || []).forEach((s) => {
          rows.push({ id: `search-${s.id}`, type: 'search', query: s.query, date: s.created_at });
        });
        (data.prescriptions || []).forEach((p) => {
          const names = Array.isArray(p.medicine_list)
            ? p.medicine_list.map((m) => m.name || m).join(', ')
            : '';
          rows.push({
            id: `rx-${p.id}`,
            type: 'prescription',
            query: names || 'Prescription upload',
            date: p.uploaded_at,
          });
        });
        (data.lab_reports || []).forEach((lr) => {
          rows.push({
            id: `lab-${lr.id}`,
            type: 'lab',
            query: lr.insights_preview || `Lab report (${lr.row_count || 0} markers)`,
            date: lr.created_at,
          });
        });
        rows.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(rows);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) return <LoadingState label="Loading history…" />;

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title="Medicine history"
        subtitle="Past searches and prescriptions extracted from uploads."
        icon={History}
      />

      {analytics?.totals ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <DashPanel title="Activity summary">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-extrabold dash-text">{analytics.totals.searches}</p>
                <p className="text-xs text-muted">Searches</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold dash-text">{analytics.totals.prescriptions}</p>
                <p className="text-xs text-muted">Prescriptions</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold dash-text">{analytics.totals.lab_reports}</p>
                <p className="text-xs text-muted">Lab reports</p>
              </div>
            </div>
          </DashPanel>
          <DashPanel className="lg:col-span-2" title="Searches this week" bodyClassName="h-48">
            {analytics.searches_per_day?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.searches_per_day}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="searches" fill="#00a896" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted">Search medicines to see weekly trends.</p>
            )}
          </DashPanel>
        </div>
      ) : null}

      <DashPanel noPadding bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[36rem]">
            <thead className="dash-table-head border-b">
              <tr>
                <th className="px-5 py-3 font-bold dash-text">Type</th>
                <th className="px-5 py-3 font-bold dash-text">Medicine / query</th>
                <th className="px-5 py-3 font-bold dash-text">Date</th>
                <th className="px-5 py-3 font-bold dash-text text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {history.length ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-teal/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      {item.type === 'search' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal/10 text-teal-dark text-xs font-bold border border-teal/20">
                          <Search size={14} /> Search
                        </span>
                      ) : item.type === 'lab' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          <FileText size={14} /> Lab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime/15 text-lime-dark text-xs font-bold border border-lime/25">
                          <FileText size={14} /> Rx
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold dash-text max-w-xs truncate">{item.query}</td>
                    <td className="px-5 py-4 text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(item.date)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.type === 'lab' ? (
                        <Link
                          to="/dashboard/reports"
                          className="inline-flex items-center gap-1 text-sm font-bold text-teal hover:text-teal-dark"
                        >
                          View reports <ExternalLink size={14} />
                        </Link>
                      ) : (
                        <Link
                          to={`/dashboard/search?q=${encodeURIComponent(item.query)}`}
                          className="inline-flex items-center gap-1 text-sm font-bold text-teal hover:text-teal-dark"
                        >
                          Search again <ExternalLink size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No history yet"
                      description="Search a medicine or upload a prescription to build your timeline."
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
        {history.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-xs dash-muted">
            Showing {history.length} {history.length === 1 ? 'entry' : 'entries'}
          </div>
        )}
      </DashPanel>
    </PageShell>
  );
};

export default MedicineHistoryPage;
