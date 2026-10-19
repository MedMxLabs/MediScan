export const NAV = [
  { label: 'Home', to: '/', hash: '' },
  { label: 'Features', to: '/', hash: '#features' },
  { label: 'How it Works', to: '/', hash: '#how-it-works' },
  { label: 'About Us', to: '/', hash: '#about' },
  { label: 'Contact', to: '/', hash: '#contact' },
];

export const navSpring = { type: 'spring', stiffness: 420, damping: 34 };

export const getNavTo = (item) =>
  item.hash ? `${item.to}${item.hash}` : { pathname: '/', hash: '' };
