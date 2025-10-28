import React from 'react';

// We set a default value for className right here
const Spinner = ({ className = "h-12 w-12" }) => {
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${className}`}
      ></div>
    </div>
  );
};

export default Spinner;