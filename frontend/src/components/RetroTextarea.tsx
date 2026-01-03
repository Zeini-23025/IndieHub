import type { TextareaHTMLAttributes } from 'react';

interface RetroTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const RetroTextarea: React.FC<RetroTextareaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2 font-pixel text-xs" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 font-mono text-sm focus:outline-none resize-none ${className}`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-red)';
          e.target.style.boxShadow = '0 0 15px var(--glow-color)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    </div>
  );
};

export default RetroTextarea;

