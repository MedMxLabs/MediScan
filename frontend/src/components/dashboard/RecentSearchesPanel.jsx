import { Link } from 'react-router-dom';
import DashPanel from './DashPanel';
import EmptyState from './EmptyState';
import Button from '../ui/Button';

const RecentSearchesPanel = ({ searches, className = '' }) => (
  <DashPanel
    className={className}
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
          {searches?.length ? (
            searches.map((row, idx) => (
              <tr key={idx} className="dash-row-hover transition-colors">
                <td className="px-5 py-3.5 font-semibold dash-text">{row.query}</td>
                <td className="px-5 py-3.5 dash-muted text-xs sm:text-sm tabular-nums">
                  {row.created_at?.replace('T', ' ').slice(0, 16) || '—'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link to={`/dashboard/compare?m=${encodeURIComponent(row.query)}`} className="text-xs dash-link">
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
);

export default RecentSearchesPanel;
