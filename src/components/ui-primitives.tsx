export const inputClassName = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
export const buttonClassName = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700";
export const successButtonClassName = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700";

export function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="text-sm text-slate-500 mt-1">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatusBadge({
  text,
  tone = "neutral"
}: {
  text: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700"
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tones[tone]}`}>{text}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 py-6 text-center">{text}</p>;
}

export function Alert({ text, tone }: { text: string; tone: "success" | "danger" }) {
  return <p className={`rounded-xl p-3 text-sm ${tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{text}</p>;
}
