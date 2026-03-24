import { UserRole } from "@prisma/client";

export type NavItem = { href: string; label: string; badge?: string };

export function getNavigation(role: UserRole): { primary: NavItem[]; secondary: NavItem[] } {
  if (role === "district_admin") {
    return {
      primary: [
        { href: "/admin", label: "Bosh sahifa" },
        { href: "/kindergartens", label: "MTTlar" },
        { href: "/clubs", label: "To'garaklar" },
        { href: "/invoices", label: "Hisob-fakturalar" },
        { href: "/payments", label: "To'lovlar" },
        { href: "/transactions", label: "Xarajatlar" },
        { href: "/suspicious", label: "Shubhali operatsiyalar", badge: "Risk" }
      ],
      secondary: [
        { href: "/limits", label: "Limitlar" },
        { href: "/users", label: "Foydalanuvchilar" }
      ]
    };
  }

  if (role === "kindergarten_director" || role === "staff") {
    return {
      primary: [
        { href: "/director", label: "Bosh sahifa" },
        { href: "/clubs", label: "To'garaklar" },
        { href: "/enrollments", label: "Yozilishlar" },
        { href: "/invoices", label: "Hisob-fakturalar" },
        { href: "/payments", label: "To'lovlar" },
        { href: "/transactions", label: "Xarajatlar" }
      ],
      secondary: []
    };
  }

  return {
    primary: [
      { href: "/parent", label: "Mening sahifam" },
      { href: "/children", label: "Farzandlarim" },
      { href: "/clubs", label: "To'garaklar" },
      { href: "/enrollments", label: "Yozilishlar" },
      { href: "/invoices", label: "Hisoblar" },
      { href: "/payments", label: "To'lovlar" },
      { href: "/parent-app", label: "Telegram WebApp" }
    ],
    secondary: []
  };
}
