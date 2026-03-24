export default function ProtectedLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
