import { Smartphone } from 'lucide-react';
import { ANDROID_APK_FILENAME, ANDROID_APK_URL } from '../constants/mobileApp';

const VARIANTS = {
  primary:
    'bg-brand-gradient text-white hover:opacity-95 focus:ring-teal shadow-brand',
  secondary:
    'bg-brand-gradient-soft text-navy hover:bg-teal/10 focus:ring-teal border border-teal/20',
  outline:
    'border border-slate-200 text-navy bg-white hover:border-teal/40 hover:bg-teal/5 focus:ring-teal',
  outlineOnDark:
    'border border-white/35 bg-transparent text-white hover:border-white/50 hover:bg-white/10 focus:ring-teal focus:ring-offset-2 focus:ring-offset-navy',
  navy: 'bg-navy text-white hover:bg-navy-light focus:ring-navy',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const AndroidAppDownloadButton = ({
  children = 'Download Android App',
  variant = 'outline',
  size = 'lg',
  className = '',
  fullWidth = false,
  showIcon = true,
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-[1.02] active:scale-[0.98] max-sm:min-h-[44px]';

  return (
    <a
      href={ANDROID_APK_URL}
      download={ANDROID_APK_FILENAME}
      className={`${base} ${VARIANTS[variant] ?? VARIANTS.outline} ${SIZES[size] ?? SIZES.lg} ${fullWidth ? 'w-full' : ''} gap-2 ${className}`}
    >
      {showIcon && <Smartphone size={size === 'sm' ? 16 : 18} className="shrink-0" />}
      {children}
    </a>
  );
};

export default AndroidAppDownloadButton;
