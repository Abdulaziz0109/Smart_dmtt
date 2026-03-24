"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlyBars({ data }: { data: Array<{ name: string; payments: number; expenses: number }> }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold">So'nggi 3 oylik moliyaviy ko'rsatkichlar</h2>
        <p className="text-sm text-slate-500 mt-1">Tushum va xarajat dinamikasini solishtirish uchun tezkor ko'rinish.</p>
      </div>
      <div className="h-80 w-full p-3">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip formatter={(value) => `${Number(value).toLocaleString()} so'm`} />
            <Legend formatter={(value) => (value === "payments" ? "Tushum" : "Xarajat")} />
            <Bar dataKey="payments" fill="#2563eb" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="#16a34a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
