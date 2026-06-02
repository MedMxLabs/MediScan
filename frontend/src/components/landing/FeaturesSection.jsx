
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import {
  Search,
  UploadCloud,
  Bell,
  FileText,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

const PRICES = [
  { name: 'TrueMeds', price: 25.7 },
  { name: 'Netmeds', price: 26.34 },
  { name: 'PharmEasy', price: 32.12 },
].sort((a, b) => a.price - b.price);

const cardBase =
  'hover-lift flex flex-col h-full min-h-[260px] sm:min-h-[280px] rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md shadow-slate-200/30 hover:shadow-xl hover:shadow-teal/10 hover:border-teal/35 group';

const CardHead = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div className="flex items-center gap-3 min-w-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-teal">
        <Icon size={22} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-navy leading-tight group-hover:text-teal-dark transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
    <ArrowRight size={18} className="text-slate-300 group-hover:text-teal shrink-0 mt-1" />
  </div>
);

const FeaturesSection = () => (
  <section id="features" className="relative pb-16 sm:pb-20 lg:pb-28 pt-6 lg:pt-10 scroll-mt-nav">
    <div className="layout-wide">
      <ScrollReveal className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-dark">What you get</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Six tools. One dashboard.
          </h2>
        </div>
        <p className="text-muted text-sm sm:text-base max-w-sm sm:text-right leading-relaxed">
          Tap any card to open that tool in your account.
        </p>
      </ScrollReveal>

      <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <Link to="/search" className={cardBase}>
          <CardHead icon={Search} title="Compare prices" subtitle="Live MRP from 6 pharmacies" />
          <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden text-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Dolo 650</p>
                <p className="font-bold text-navy">15 tablets</p>
              </div>
              <TrendingDown size={18} className="text-teal shrink-0" />
            </div>
            <ul className="divide-y divide-slate-100">
              {PRICES.map((row, i) => (
                <li
                  key={row.name}
                  className={`flex justify-between items-center px-4 py-3 ${
                    i === 0 ? 'bg-teal/5' : 'bg-white'
                  }`}
                >
                  <span className="font-medium text-navy">{row.name}</span>
                  <span className="font-bold tabular-nums text-navy">
                    ₹{row.price.toFixed(2)}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-teal-dark">Lowest</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Link>

        <Link to="/upload" className={cardBase}>
          <CardHead icon={UploadCloud} title="Upload Rx" subtitle="Photo or PDF → medicine list" />
          <div className="flex-1 flex flex-col justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
            <UploadCloud size={32} className="mx-auto text-teal/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-navy">Drop file here</p>
            <p className="text-xs text-muted mt-2">Dolo 650 · Metformin 500</p>
          </div>
        </Link>

        <Link to="/assistant" className={cardBase}>
          <CardHead icon={MessageSquare} title="Health assistant" subtitle="Ask in plain English" />
          <div className="flex-1 flex flex-col justify-end gap-2">
            <div className="rounded-2xl bg-slate-100 px-3 py-2.5 text-xs text-navy leading-relaxed">
              Can I take Dolo with my BP tablet?
            </div>
            <div className="rounded-2xl bg-teal/10 border border-teal/20 px-3 py-2.5 text-xs text-navy leading-relaxed ml-4">
              Info only — confirm with your doctor.
            </div>
          </div>
        </Link>

        <Link to="/login" className={cardBase}>
          <CardHead icon={Bell} title="Reminders" subtitle="Doses & refills" />
          <div className="flex-1 flex items-center">
            <div className="w-full flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4">
              <Bell size={20} className="text-orange-500 shrink-0" />
              <div>
                <p className="font-bold text-navy">Metformin 500</p>
                <p className="text-sm text-muted">Today at 8:00 PM</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/login" className={cardBase}>
          <CardHead icon={FileText} title="Lab reports" subtitle="PDF → readable summary" />
          <div className="flex-1 rounded-xl border border-slate-100 divide-y divide-slate-100 text-sm overflow-hidden">
            <div className="flex justify-between px-4 py-3 bg-white">
              <span className="font-medium text-navy">HbA1c</span>
              <span className="font-bold text-teal-dark">6.8%</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-slate-50">
              <span className="font-medium text-navy">LDL cholesterol</span>
              <span className="text-muted font-medium">Borderline</span>
            </div>
            <div className="px-4 py-3 bg-white text-xs text-muted">+ 4 more markers summarized</div>
          </div>
        </Link>

        <Link to="/login" className={cardBase}>
          <CardHead icon={TrendingUp} title="Adherence" subtitle="Weekly score & streak" />
          <div className="flex-1 flex items-center justify-center gap-6">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="url(#adherenceGrad)"
                  strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset="16"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="adherenceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00a896" />
                    <stop offset="100%" stopColor="#84cc16" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-navy">
                82%
              </span>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-navy">12</p>
              <p className="text-sm text-muted">day streak</p>
            </div>
          </div>
        </Link>
      </ScrollReveal>
    </div>
  </section>
);

export default FeaturesSection;
