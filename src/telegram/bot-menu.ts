export const telegramBotMenu = {
  commands: [
    { command: "start", description: "Bosh menyu" },
    { command: "children", description: "Farzandlarim" },
    { command: "invoices", description: "To'lanmagan invoice" },
    { command: "payments", description: "To'lov tarixi" },
    { command: "webapp", description: "WebApp-ni ochish" }
  ],
  quickReplies: ["Farzandlarim", "To'garaklar", "To'lash", "Tarix"],
  notifications: {
    paymentReminder: "Eslatma: to'lanmagan invoice mavjud.",
    paymentConfirmed: "To'lovingiz muvaffaqiyatli qabul qilindi. Rahmat!"
  }
} as const;
