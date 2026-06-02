
import { Link } from 'react-router-dom';
import { ANDROID_APK_FILENAME, ANDROID_APK_URL } from '../../constants/mobileApp';
import Logo from '../Logo';
import BackedByMicrosoft from '../BackedByMicrosoft';

const PRODUCT_LINKS = [
  { label: 'Price search', to: '/search' },
  { label: 'Prescription OCR', to: '/upload' },
  { label: 'AI assistant', to: '/assistant' },
  { label: 'Jan Aushadhi locator', to: '/jan-aushadhi' },
  { label: 'Lab reports', to: '/login' },
  { label: 'Android app', href: ANDROID_APK_URL, download: ANDROID_APK_FILENAME },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Privacy', href: '#' },
  { label: 'Contact', href: 'mailto:support@medmx.in' },
];

const FooterLinkColumn = ({ title, children }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-teal mb-4">{title}</p>
    <ul className="space-y-2.5">{children}</ul>
  </div>
);

const LandingFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="relative bg-navy text-white mt-auto scroll-mt-nav overflow-hidden rounded-t-[1.75rem] sm:rounded-t-[2.25rem]"
    >
      <div className="relative z-10 layout-wide py-14 lg:py-16 pb-[clamp(6rem,14vw,10rem)]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-12">
          <div>
            <Logo size="md" showLink={false} theme="on-dark" />
            <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-sm">
              Smart medicine price comparison, prescriptions, and health insights for India.
            </p>
          </div>

          <FooterLinkColumn title="Product">
            {PRODUCT_LINKS.map(({ label, to, href, download }) => (
              <li key={label}>
                {href ? (
                  <a
                    href={href}
                    download={download}
                    className="text-sm text-slate-300 hover:text-lime transition-colors duration-300"
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    to={to}
                    className="text-sm text-slate-300 hover:text-lime transition-colors duration-300"
                  >
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </FooterLinkColumn>

          <FooterLinkColumn title="Company">
            {COMPANY_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-sm text-slate-300 hover:text-lime transition-colors duration-300"
                >
                  {label}
                </a>
              </li>
            ))}
          </FooterLinkColumn>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-3">
            <BackedByMicrosoft variant="dark" />
            <p>© {year} MedMx LABS. All rights reserved. Informational only — not medical advice.</p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime transition-colors duration-300"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime transition-colors duration-300"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 h-[clamp(6.5rem,16vw,12rem)] overflow-hidden"
        aria-hidden
      >
        <p className="landing-footer-watermark absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[48%] whitespace-nowrap font-extrabold tracking-tight">
          MedMx
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
