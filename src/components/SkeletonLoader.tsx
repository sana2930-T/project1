import React from "react";

export const SkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
      <div className="space-y-2 pt-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg w-full"></div>
        ))}
      </div>
    </div>
  );
};
