// src/services/api.ts

const BASE_URL = "https://api.collectapi.com/economy";
const API_KEY = process.env.EXPO_PUBLIC_COLLECTAPI_KEY;

export interface MarketRate {
  USD: number;
  EUR: number;
  ALTIN: number;
}

/**
 * CollectAPI endpoints for Gold and Currency rates.
 * Gold: /goldPrice
 * Currency: /allCurrency
 */
export async function fetchMarketRates(): Promise<MarketRate> {
  if (!API_KEY || API_KEY === "38t2g9zTH4ESAI9FGCeauq:3NSSFz5oryIBhToLXeaq6M") {
    // If key is not set or still placeholder, we might want to throw or return demo rates
    // But since the user provided it, we expect it to be in .env
  }

  const headers = {
    "content-type": "application/json",
    "authorization": `apikey ${API_KEY}`,
  };

  try {
    // Fetch Gold Price
    const goldRes = await fetch(`${BASE_URL}/goldPrice`, { headers });
    if (!goldRes.ok) throw new Error(`API Error (Gold): ${goldRes.status}`);
    const goldData = await goldRes.json();
    
    // Fetch All Currency
    const curRes = await fetch(`${BASE_URL}/allCurrency`, { headers });
    if (!curRes.ok) throw new Error(`API Error (Currency): ${curRes.status}`);
    const curData = await curRes.json();

    if (!goldData.success || !curData.success) {
      throw new Error("API request failed");
    }

    // Parse Gold (Gram Altın)
    const gramGold = goldData.result.find((item: any) => item.name === "Gram Altın");
    const goldPrice = gramGold 
      ? (typeof gramGold.selling === "number" ? gramGold.selling : parseFloat(gramGold.selling.replace(",", "."))) 
      : 0;

    // Parse USD
    const usdItem = curData.result.find((item: any) => item.name === "USD Amerikan Doları");
    const usdPrice = usdItem 
      ? (typeof usdItem.selling === "number" ? usdItem.selling : parseFloat(usdItem.selling.replace(",", "."))) 
      : 0;

    // Parse EUR
    const eurItem = curData.result.find((item: any) => item.name === "EUR Euro");
    const eurPrice = eurItem 
      ? (typeof eurItem.selling === "number" ? eurItem.selling : parseFloat(eurItem.selling.replace(",", "."))) 
      : 0;

    return {
      USD: usdPrice,
      EUR: eurPrice,
      ALTIN: goldPrice,
    };
  } catch (error) {
    console.error("Error fetching market rates:", error);
    throw error;
  }
}
