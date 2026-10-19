import { Bell, TrendingUp, Pill, IndianRupee } from 'lucide-react';
import StatCard from './StatCard';

const DashboardStats = ({ widgets }) => (
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
);

export default DashboardStats;
