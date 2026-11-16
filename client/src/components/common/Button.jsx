import { Link } from 'react-router-dom';
import Loader from './Loader.jsx';

// Button styles — oru idathula maathina full app-um maarum
const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Reusable Button
 * - variant: primary | secondary | outline | ghost | danger
 * - size: sm | md | lg
 * - loading: true-na spinner kaattum, click aagaadhu
 * - to: kudutha, button-ku badhila page link-ah work aagum
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  to,
  type = 'button',
  disabled,
  className = '',
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Loader size="sm" inline />}
      {children}
    </button>
  );
}
