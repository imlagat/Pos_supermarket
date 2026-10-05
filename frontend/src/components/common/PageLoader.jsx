import React from 'react';

export default function PageLoader({ message }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] h-full w-full py-20 bg-slate-50/50">
      <div className="w-11 h-11 border-[2.5px] border-orange-500 border-t-transparent border-r-transparent rounded-full animate-spin" />
      {message && (
        <p className="mt-4 text-xs font-medium text-gray-400 tracking-wider uppercase">{message}</p>
      )}
    </div>
  );
}
