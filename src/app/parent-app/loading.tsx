export default function ParentAppLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
