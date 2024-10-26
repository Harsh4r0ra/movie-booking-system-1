import React from 'react';

export const Alert = ({ children, className }) => (
  <div className={`p-4 rounded shadow ${className}`}>{children}</div>
);

export const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);
