import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Search, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { setSearchResults, addRecentSearch, setLoading, setError } from '../store/slices/medicineSlice';
import { searchMedicines } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const TIPS = [
  { title: 'Search by brand name', hint: 'Brand or trade name (e.g. Dolo 650)' },
  { title: 'Search by generic name', hint: 'Salt / composition (e.g. Paracetamol)' },
  { title: 'Compare prices & save more', hint: 'Live prices from 6 major pharmacies' },
];

const SearchMedicinePage = () => {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector((state) => state.medicine);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    dispatch(setSearchResults([]));
  }, [dispatch]);

  const handleSearch = async (e, opts = {}) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    setFetchError('');
    dispatch(setLoading(true));
    dispatch(addRecentSearch(query));

    try {
      const results = await searchMedicines(query, { refresh: Boolean(opts.refresh) });
      dispatch(setSearchResults(results));
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      const backendMsg =
        typeof body === 'object' && body !== null && typeof body.message === 'string'
          ? body.message
          : typeof body === 'string'
            ? body
            : null;
      let msg = backendMsg || err.message || 'Search failed';
      if (status === 502) {
        msg =
          backendMsg ||
          'Live prices could not be loaded (502). Usually every pharmacy scrape failed, or the request timed out. Retry shortly.';
      }
      setFetchError(msg);
      dispatch(setError(msg));
      dispatch(setSearchResults([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-2">
      <div className="dna-pattern rounded-2xl border border-teal/10 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-brand">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy tracking-tight">Search Medicine</h2>
            <p className="text-sm text-muted mt-1">Compare live prices across PharmEasy, Netmeds, Apollo, TrueMeds, MedPlus & Tata 1mg</p>
          </div>
        </div>

        <form onSubmit={(ev) => handleSearch(ev, {})} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            className="flex-1"
            placeholder="Enter medicine name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading} size="lg" className="sm:min-w-[120px]">
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>
      </div>

      {!hasSearched ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wide mb-5 flex items-center gap-2">
              <Sparkles size={16} className="text-teal" />
              Quick tips
            </h3>
            <ul className="space-y-5">
              {TIPS.map((tip) => (
                <li key={tip.title} className="flex items-start gap-3">
                  <div className="text-teal mt-0.5">
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{tip.title}</p>
                    {'hint' in tip && tip.hint && (
                      <p className="text-xs text-muted mt-0.5">{tip.hint}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-brand-gradient-soft border-teal/15">
            <h3 className="text-sm font-bold text-navy mb-2">Why MedMx LABS?</h3>
            <p className="text-sm text-muted leading-relaxed">
              We pull real-time prices from India&apos;s top online pharmacies so you can find the best deal before you buy — no guesswork, no outdated listings.
            </p>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {fetchError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{fetchError}</div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy">
              {searchResults.length} results for <span className="text-gradient">{query}</span>
            </h3>
            <div className="flex items-center gap-4">
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSearch(null, { refresh: true })}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-teal-dark disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Refresh live prices
                </button>
              )}
              <button
                type="button"
                onClick={() => { setHasSearched(false); setQuery(''); }}
                className="text-xs font-bold text-muted hover:text-navy"
              >
                Clear search
              </button>
            </div>
          </div>

          {searchResults.length === 0 && !loading && !fetchError && (
            <Card className="p-8 text-center">
              <p className="text-muted text-sm">No results found. Try a different spelling or generic name.</p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {searchResults.map((item) => (
              <Card key={item.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal/20 transition-colors">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-navy">{item.name}</h3>
                    {item.savings && item.savings !== '—' && (
                      <span className="bg-teal/10 text-teal-dark text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {item.savings}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mb-2">{item.packSize}</p>
                  <p className="text-xs font-medium text-navy/80">
                    Pharmacy: <span className="font-bold">{item.pharmacy}</span>
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                  <div className="text-xl font-bold text-navy">₹{item.price}</div>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer noopener">
                      <Button size="sm" className="gap-1.5">
                        Visit site
                        <ExternalLink size={14} />
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" disabled variant="outline">
                      No link
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchMedicinePage;
