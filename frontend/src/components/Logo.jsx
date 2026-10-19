
import { Link } from 'react-router-dom';
import logoLight from '../assets/medmx-logo-light.webp';
import logoOnDark from '../assets/medmx-logo-on-dark.webp';

const SIZES = {
  sm: 'h-8',
  md: 'h-10 sm:h-11',
  lg: 'h-12 sm:h-14',
  xl: 'h-16 sm:h-[4.5rem]',
};

/**
 * @param {'light' | 'on-dark'} theme
 * - light: navy text on transparent — white / light page backgrounds
 * - on-dark: white text + brand colors — navy navbar, footer, sidebar
 */
const Logo = ({ to = '/', className = '', size = 'md', showLink = true, theme = 'light' }) => {
  const src = theme === 'on-dark' ? logoOnDark : logoLight;

  const img = (
    <img
      src={src}
      alt="MedMx LABS"
      className={`${SIZES[size] || SIZES.md} w-auto max-w-[min(100%,16rem)] object-contain object-left`}
      draggable={false}
    />
  );

  if (!showLink) {
    return <span className={`inline-flex items-center shrink-0 ${className}`}>{img}</span>;
  }

  return (
    <Link to={to} className={`inline-flex items-center shrink-0 ${className}`} aria-label="MedMx LABS home">
      {img}
    </Link>
  );
};

export default Logo;
