import axios from "axios";
import { FinanceData } from "./finance-data";

var baseUrl =
  "https://func-stocks-areve.azurewebsites.net/api/yahoo-finance-proxy?";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export var getCurrentData = function (ticker: string): Promise<FinanceData> {
  return new Promise(async function (resolve, _reject) {
    const response = await axios.get(baseUrl + ticker + "/");
    const quoteDataMatch = response.data.match(
      /"quoteData":({.*?}),"mktmData"/
    );
    const quoteData = JSON.parse(quoteDataMatch[1]);
    const data = quoteData[ticker];
    resolve({
      id: data.symbol,
      price: data.regularMarketPrice.raw,
      time: new Date().getTime(),
      currency: data.currency,
      exchange: data.exchange,
      quoteType: data.quoteType,
      changePercent: 0,
      dayVolume: data.regularMarketVolume.raw,
      dayHigh: data.regularMarketDayHigh.raw,
      dayLow: data.regularMarketDayLow.raw,
      change: 0,
      shortName: data.shortName,
      priceHint: data.priceHint,
      fromcurrency: data.fromCurrency,
      lastMarket: data.quoteSourceName,
      marketcap: data.marketCap.raw,
      openPrice: data.regularMarketOpen.raw,
      marketHours:
        data.marketState === "REGULAR" ? "REGULAR_MARKET" : undefined,
    });
  });
};
