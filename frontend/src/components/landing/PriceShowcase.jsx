
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import ScrollReveal from './ScrollReveal';

const ROWS = [
  {
    name: 'Dolo 650 Tablet',
    pack: '15 tablets',
    prices: [
      { pharmacy: 'Netmeds', price: '26.34', best: true },
      { pharmacy: 'TrueMeds', price: '25.70', best: false },
      { pharmacy: 'PharmEasy', price: '32.12', best: false },
      { pharmacy: 'Tata 1mg', price: '28.50', best: false },
    ],
  },
  {
    name: 'Crocin Advance',
    pack: '20 tablets',
    prices: [
      { pharmacy: 'Apollo', price: '58.00', best: true },
      { pharmacy: 'MedPlus', price: '62.50', best: false },
      { pharmacy: 'Netmeds', price: '64.00', best: false },
    ],
  },
];

const PriceShowcase = () => (
  <section className="relative py-12 sm:py-16 lg:py-24 border-t border-slate-200/80 scroll-mt-nav">
    <div className="layout-wide">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
        <ScrollReveal>
          <p className="text-sm font-semibold text-teal-dark">Example output</p>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy leading-tight tracking-tight">
            Same medicine.
            <br />
            Different MRP.
          </h2>
          <p className="mt-4 sm:mt-5 text-muted text-base sm:text-lg leading-relaxed">
            This is what a real search looks like — pulled when you hit compare, not from a static spreadsheet we
            updated last quarter.
          </p>
          <Link to="/dashboard/search" className="inline-block mt-6 sm:mt-8 w-full sm:w-auto">
            <Button variant="primary" size="lg" className="gap-2 w-full sm:w-auto">
              Search a medicine <ArrowRight size={18} />
            </Button>
          </Link>
        </ScrollReveal>

        <ScrollReveal>
          <div className="hover-lift bg-white border border-slate-200 rounded-xl sm:rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-teal/25 overflow-x-auto">
            <div className="min-w-[280px]">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between text-xs font-semibold text-muted uppercase tracking-wide">
                <span>Result</span>
                <span>MRP (INR)</span>
              </div>
              {ROWS.map((row, ri) => (
                <div key={row.name} className={ri > 0 ? 'border-t border-slate-200' : ''}>
                  <div className="px-4 py-3 bg-navy/[0.03]">
                    <p className="font-bold text-navy text-sm sm:text-base">{row.name}</p>
                    <p className="text-xs text-muted">{row.pack}</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {row.prices.map((p) => (
                        <tr
                          key={p.pharmacy}
                          className={`border-t border-slate-100 transition-colors hover:bg-teal/[0.04] ${
                            p.best ? 'bg-teal/[0.06]' : ''
                          }`}
                        >
                          <td className="px-4 py-2.5 font-medium text-navy">
                            {p.pharmacy}
                            {p.best && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-teal-dark">Lowest</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-navy tabular-nums">₹{p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <p className="px-4 py-3 text-xs text-muted border-t border-slate-100">
                Illustrative snapshot · prices change on pharmacy sites
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default PriceShowcase;
