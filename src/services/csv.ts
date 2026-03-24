import { parse } from "csv-parse/sync";

export type CsvRow = {
  kindergartenName: string;
  cardLast4?: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  transactionTime: string;
  currency: string;
  rawReference: string;
  status: string;
};

const mapField = (row: Record<string, string>, keys: string[]) => {
  const entry = Object.entries(row).find(([k]) => keys.includes(k.toLowerCase().trim()));
  return entry?.[1];
};

export function parseTransactionsCsv(content: string): { rows: CsvRow[]; errors: string[] } {
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const rows: CsvRow[] = [];
  const errors: string[] = [];

  records.forEach((record, index) => {
    try {
      const row: CsvRow = {
        kindergartenName: mapField(record, ["kindergarten", "mtt", "kindergarten_name"]) || "",
        cardLast4: mapField(record, ["card_last4", "card"]),
        merchantName: mapField(record, ["merchant_name", "merchant"]) || "",
        merchantCategory: mapField(record, ["merchant_category", "category"]) || "",
        amount: Number(mapField(record, ["amount", "summa"])),
        transactionTime: mapField(record, ["transaction_time", "time", "date"]) || "",
        currency: mapField(record, ["currency"]) || "UZS",
        rawReference: mapField(record, ["reference", "raw_reference"]) || `row-${index + 1}`,
        status: mapField(record, ["status"]) || "completed"
      };
      if (!row.kindergartenName || !row.merchantName || !row.transactionTime || Number.isNaN(row.amount)) throw new Error("Majburiy ustunlar yo'q");
      rows.push(row);
    } catch (e) {
      errors.push(`Qator ${index + 2}: ${(e as Error).message}`);
    }
  });

  return { rows, errors };
}
