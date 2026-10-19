import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashPanel from './DashPanel';

const AdherenceTrendPanel = ({ score, trend }) => (
  <DashPanel title="Adherence this week" bodyClassName="pb-4">
    <p className="text-3xl font-extrabold dash-text tabular-nums">{score}%</p>
    <div className="h-40 sm:h-44 mt-4 -mx-1">
      {trend?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#f1f5f9',
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
              }}
              formatter={(value) => [`${value}%`, 'Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#2dd4bf"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2dd4bf' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm dash-muted py-6 leading-relaxed">Log doses from Reminders to see your trend.</p>
      )}
    </div>
  </DashPanel>
);

export default AdherenceTrendPanel;
