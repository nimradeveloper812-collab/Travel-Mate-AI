export function CardShimmer() {
  return (
    <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm space-y-4 animate-pulse">
      <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
      <div className="h-4 w-full bg-slate-200 rounded-lg"></div>
      <div className="h-4 w-5/6 bg-slate-200 rounded-lg"></div>
    </div>
  );
}

export function StatsShimmer() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm flex items-center space-x-4 animate-pulse">
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg"></div>
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableShimmer() {
  return (
    <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
      <div className="h-6 w-1/4 bg-slate-200 rounded-lg"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-10 w-1/4 bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-1/4 bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-1/4 bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-1/4 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
