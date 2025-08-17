
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-slate-500 border-t-sky-400`}
      ></div>
      {text && <p className="text-slate-400 font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default Loader;
