import React, { useEffect, useState } from 'react';
import { Search, FileText, Calendar, ExternalLink, History } from 'lucide-react';
import { getHistory } from '../services/api';
import { Link } from 'react-router-dom';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import LoadingState from '../components/dashboard/LoadingState';
import EmptyState from '../components/dashboard/EmptyState';
import Button from '../components/ui/Button';

const MedicineHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
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
        rows.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(rows);
      } catch (err) {
        console.error(err);
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

      <DashPanel noPadding bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[36rem]">
            <thead className="bg-slate-50/90 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-bold text-navy">Type</th>
                <th className="px-5 py-3 font-bold text-navy">Medicine / query</th>
                <th className="px-5 py-3 font-bold text-navy">Date</th>
                <th className="px-5 py-3 font-bold text-navy text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.length ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-teal/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      {item.type === 'search' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal/10 text-teal-dark text-xs font-bold border border-teal/20">
                          <Search size={14} /> Search
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime/15 text-lime-dark text-xs font-bold border border-lime/25">
                          <FileText size={14} /> Rx
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-navy max-w-xs truncate">{item.query}</td>
                    <td className="px-5 py-4 text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(item.date)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/dashboard/search?q=${encodeURIComponent(item.query)}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-teal hover:text-teal-dark"
                      >
                        Search again <ExternalLink size={14} />
                      </Link>
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
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-muted">
            Showing {history.length} {history.length === 1 ? 'entry' : 'entries'}
          </div>
        )}
      </DashPanel>
    </PageShell>
  );
};

export default MedicineHistoryPage;
