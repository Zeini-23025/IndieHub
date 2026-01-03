import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    primary: 'btn-retro',
    secondary: 'btn-retro',
    danger: 'btn-retro',
  };

  const variantStyles = {
    primary: {
      background: 'var(--accent-primary)',
      borderColor: 'var(--accent-primary)',
      color: '#fff',
    },
    secondary: {
      background: 'transparent',
      borderColor: 'var(--accent-primary)',
      color: 'var(--accent-primary-bright)',
    },
    danger: {
      background: 'var(--error)',
      borderColor: 'var(--error)',
      color: '#fff',
    },
  };

  return (
    <button
      className={`${variantClasses[variant]} ${className}`}
      style={variantStyles[variant]}
      {...props}
    >
      {children}
    </button>
  );
};

export default RetroButton;

