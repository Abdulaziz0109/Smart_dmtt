"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="border rounded px-3 py-1"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      Chiqish
    </button>
  );
}
