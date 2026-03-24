"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function MonthlyBars({ data }: { data: Array<{ name: string; payments: number; expenses: number }> }) {
  return <div className="h-72 w-full bg-white p-4 rounded shadow"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="payments" fill="#2563eb" /><Bar dataKey="expenses" fill="#16a34a" /></BarChart></ResponsiveContainer></div>;
}
