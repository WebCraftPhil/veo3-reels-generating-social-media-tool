
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg my-4">
      <p className="font-semibold">Oops! Something went wrong.</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default ErrorDisplay;
