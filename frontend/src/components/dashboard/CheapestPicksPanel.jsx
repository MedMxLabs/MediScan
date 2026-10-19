import { Link } from 'react-router-dom';
import DashPanel from './DashPanel';

const CheapestPicksPanel = ({ picks }) => {
  if (!picks?.length) return null;

  return (
    <DashPanel title="Cheapest picks for you">
      <div className="flex flex-wrap gap-4">
        {picks.map((pick, idx) => (
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
                <a href={pick.url} target="_blank" rel="noopener noreferrer" className="text-xs dash-link">
                  Buy →
                </a>
              ) : null}
              <Link to={`/dashboard/compare?m=${encodeURIComponent(pick.query)}`} className="text-xs dash-link">
                Compare again
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashPanel>
  );
};

export default CheapestPicksPanel;
