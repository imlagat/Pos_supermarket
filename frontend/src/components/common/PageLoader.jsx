import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col justify-center items-center h-64 w-full">
      <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">{message}</p>
    </div>
  );
}
