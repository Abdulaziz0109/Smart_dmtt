"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dmtt.uz");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        className="bg-white p-8 rounded-lg shadow w-full max-w-md space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          const result = await signIn("credentials", { email, password, redirect: false });
          setLoading(false);
          if (result?.error) {
            setError("Login muvaffaqiyatsiz");
            return;
          }
          router.push("/");
          router.refresh();
        }}
      >
        <h1 className="text-xl font-bold">MTT Tizimi - Kirish</h1>
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button disabled={loading} className="w-full bg-blue-600 disabled:bg-blue-300 text-white rounded p-2">{loading ? "Kutilmoqda..." : "Kirish"}</button>
      </form>
    </div>
  );
}
