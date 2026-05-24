import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Button from '../components/ui/Button';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import LoadingState from '../components/dashboard/LoadingState';
import { compareMedicine, getAlternatives } from '../services/api';

const MedicineComparisonPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const medicineName = searchParams.get('m')?.trim() || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [generics, setGenerics] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!medicineName) {
        setLoading(false);
        setError('Pass a medicine query: /dashboard/compare?m=Your+Medicine');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [data, alts] = await Promise.all([
          compareMedicine(medicineName),
          getAlternatives(medicineName).catch(() => null),
        ]);
        if (!cancelled) {
          setPayload(data);
          setGenerics(alts?.alternatives || []);
        }
      } catch (e) {
        const msg =
          e.response?.data?.message ||
          e.message ||
          'Could not load comparison (check backend / Playwright).';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [medicineName]);

  const prices = payload?.prices || [];
  const lowest = prices.length ? Math.min(...prices.map((p) => Number(p.price))) : null;
  const cheapest = prices.find((p) => Number(p.price) === lowest);
  const alternatives = payload?.alternatives || [];

  if (loading) return <LoadingState label="Fetching live pharmacy listings…" />;

  if (error || !payload) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          to="/dashboard/search"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal"
        >
          <ArrowLeft size={16} /> Back to Search
        </Link>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-800 text-sm">{error}</div>
      </div>
    );
  }

  if (payload.failed_all) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link to="/dashboard/search" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal">
          <ArrowLeft size={16} /> Back to Search
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          All pharmacy sources failed for «{payload.query}». Check Playwright / network on the API host.
        </div>
      </div>
    );
  }

  return (
    <PageShell className="max-w-6xl">
      <Link
        to="/dashboard/search"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-teal transition-colors"
      >
        <ArrowLeft size={16} /> Back to search
      </Link>
      <PageHeader
        title={payload.medicine_display || medicineName}
        subtitle="Live scrape — verify pack and price on the pharmacy site."
        icon={BarChart3}
      />
      {cheapest && (
        <div className="rounded-2xl border border-teal/25 bg-teal/5 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm font-semibold text-teal-dark">Lowest MRP in this result set</p>
          <div className="text-center sm:text-right">
            <p className="text-3xl font-extrabold text-teal tabular-nums">₹{Number(cheapest.price).toFixed(2)}</p>
            <p className="text-xs text-muted mt-1">at {cheapest.pharmacy_name}</p>
          </div>
        </div>
      )}

      <DashPanel title="Price comparison" noPadding bodyClassName="">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Pharmacy</th>
                <th className="px-6 py-4">Pack</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Unit price</th>
                <th className="px-6 py-4">vs lowest</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4 text-right">Buy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {prices.map((row, idx) => {
                const isLow = cheapest && row.pharmacy_name === cheapest.pharmacy_name;
                const savingsPct = row.savings_percent_vs_lowest;
                return (
                  <tr key={`${row.pharmacy_name}-${idx}`} className={isLow ? 'bg-teal/10/30' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      {row.pharmacy_name}
                      {isLow && (
                        <span className="inline-flex rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal-dark">
                          Lowest
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{row.pack_size || '—'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{Number(row.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500">{row.unit_price != null ? `₹${row.unit_price}` : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{savingsPct != null ? `${savingsPct}%` : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{row.availability || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer noopener">
                          <Button variant="primary" size="sm">
                            Visit
                          </Button>
                        </a>
                      ) : (
                        <Button variant="primary" size="sm" disabled>
                          —
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-5 sm:px-6 py-4 text-xs text-muted border-t border-slate-100">
          Prices and links come from pharmacy search pages at query time — not cached demo data.
        </p>
      </DashPanel>

      {generics.length > 0 && (
        <DashPanel
          title="Generic alternatives"
          noPadding
          bodyClassName=""
          action={
            <p className="text-xs text-muted hidden sm:block">Same composition from catalog</p>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Generic / composition</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4 text-right">Compare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {generics.map((g) => (
                  <tr key={g.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{g.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {g.generic_name || g.composition || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{g.manufacturer || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/dashboard/compare?m=${encodeURIComponent(g.name)}`}
                        className="text-teal hover:text-teal-dark text-sm font-bold"
                      >
                        Compare prices
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashPanel>
      )}

      {alternatives.length > 0 && (
        <DashPanel title="Ranked offers (same query)" noPadding bodyClassName="">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Pharmacy</th>
                  <th className="px-6 py-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {alternatives.map((a) => (
                  <tr key={a.rank}>
                    <td className="px-6 py-4">{a.rank}</td>
                    <td className="px-6 py-4 font-medium">{a.pharmacy_name}</td>
                    <td className="px-6 py-4 text-gray-500">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashPanel>
      )}
    </PageShell>
  );
};

export default MedicineComparisonPage;
