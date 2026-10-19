import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import DashPanel from './DashPanel';
import EmptyState from './EmptyState';
import Button from '../ui/Button';

const SchedulePanels = ({ medicinesToday, remindersPreview }) => (
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
);

export default SchedulePanels;
