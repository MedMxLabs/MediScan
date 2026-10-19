import { Link } from 'react-router-dom';
import { IndianRupee, Loader2, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

const MedicineResultItem = ({ med, index, priceData, comparing, err, onCompare, comparePageBase }) => {
  const name = med?.name || '';
  const prices = priceData?.prices || [];
  const isLoading = comparing[name];
  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price));
  const ingredients = Array.isArray(med?.ingredients) ? med.ingredients : [];
  const brandEquivalents = Array.isArray(med?.brand_equivalents) ? med.brand_equivalents : [];

  return (
    <div className="dash-list-row space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-sm font-bold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h4 className="font-bold dash-text">{name}</h4>
            {med?.kind === 'combination' ? (
              <p className="text-xs dash-muted mt-0.5">Combination formulation</p>
            ) : null}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={isLoading}
          onClick={() => onCompare(name)}
          className="shrink-0 gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Fetching…
            </>
          ) : (
            <>
              <IndianRupee size={14} /> Compare prices
            </>
          )}
        </Button>
      </div>

      {ingredients.length ? (
        <details className="rounded-xl dash-inset px-3 py-2">
          <summary className="text-xs font-bold dash-text cursor-pointer select-none">
            View ingredients ({ingredients.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs dash-muted list-disc pl-4">
            {ingredients.map((ing) => (
              <li key={ing}>{ing}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {brandEquivalents.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold dash-muted">Equivalent brands for price comparison</p>
          <div className="flex flex-wrap gap-2">
            {brandEquivalents.map((brand) => (
              <Button
                key={brand}
                variant="outline"
                size="sm"
                disabled={comparing[brand]}
                onClick={() => onCompare(brand)}
                className="text-xs font-semibold"
              >
                {comparing[brand] ? 'Fetching…' : brand}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {err && <p className="text-xs text-red-600 dark:text-red-400 pl-11">{err}</p>}

      {sorted.length > 0 && (
        <ul className="pl-11 space-y-2 border-t border-slate-200 dark:border-slate-600 pt-3">
          {sorted.slice(0, 6).map((row, i) => (
            <li key={`${row.pharmacy_name}-${i}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="dash-muted">
                {row.pharmacy_name}
                {row.pack_size ? ` · ${row.pack_size}` : ''}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-teal tabular-nums">₹{Number(row.price).toFixed(2)}</span>
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline inline-flex items-center gap-0.5 text-xs"
                  >
                    Buy <ExternalLink size={12} />
                  </a>
                ) : null}
              </span>
            </li>
          ))}
          <li className="pt-1">
            <Link to={`${comparePageBase}?m=${encodeURIComponent(name)}`} className="text-xs dash-link">
              Full comparison →
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
};

export default MedicineResultItem;
