// src/services/ImportService.ts
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { Transaction, TransactionType } from "../types";

export interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

const COMMON_MAPPINGS: Record<string, string> = {
  // Turkish
  "tarih": "date",
  "işlem tarihi": "date",
  "açıklama": "description",
  "işlem açıklaması": "description",
  "tutar": "amount",
  "miktar": "amount",
  "etiket": "category",
  // English
  "date": "date",
  "description": "description",
  "amount": "amount",
};

export async function parseBankStatement(uri: string): Promise<ImportedTransaction[]> {
  try {
    let b64Data: string;
    
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      b64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
    } else {
      b64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const workbook = XLSX.read(b64Data, { type: "base64" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (rawData.length < 2) return [];

    // --- Dynamic Header Detection ---
    let headerRowIndex = -1;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rawData.length, 50); i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const normalizedRow = row.map(cell => String(cell || "").toLowerCase().trim());
      if (normalizedRow.includes("tarih") && (normalizedRow.includes("açıklama") || normalizedRow.includes("tutar"))) {
        headerRowIndex = i;
        headers = normalizedRow;
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback to first row if no header found
      headerRowIndex = 0;
      headers = (rawData[0] as string[]).map(h => String(h || "").toLowerCase().trim());
    }

    const dataRows = rawData.slice(headerRowIndex + 1);
    const transactions: ImportedTransaction[] = [];

    dataRows.forEach((row) => {
      let date = "";
      let description = "";
      let amount = 0;
      let category = "Diğer";

      headers.forEach((header, index) => {
        const key = COMMON_MAPPINGS[header];
        const val = row[index];
        if (val === undefined || val === null || val === "") return;

        if (key === "date") {
          if (typeof val === "number") {
             const d = XLSX.SSF.parse_date_code(val);
             date = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
          } else {
             const cleaned = String(val).split(" ")[0].trim();
             // DD/MM/YYYY or DD.MM.YYYY
             const parts = cleaned.includes("/") ? cleaned.split("/") : cleaned.split(".");
             if (parts.length === 3) {
               if (parts[0].length === 2 && parts[2].length === 4) {
                 date = `${parts[2]}-${parts[1]}-${parts[0]}`;
               } else if (parts[0].length === 4) {
                 date = `${parts[0]}-${parts[1]}-${parts[2]}`;
               }
             }
          }
        } else if (key === "description") {
          description = String(val).trim();
        } else if (key === "amount") {
          amount = typeof val === "number" ? val : parseFloat(String(val).replace(/\./g, "").replace(",", "."));
        } else if (key === "category") {
          category = String(val).trim();
        }
      });

      if (description && amount !== 0) {
        transactions.push({
          date: date || new Date().toISOString().split("T")[0],
          description,
          amount,
          type: amount > 0 ? "income" : "expense",
          category,
        });
      }
    });

    return transactions;
  } catch (error) {
    console.error("Error parsing bank statement:", error);
    throw error;
  }
}
