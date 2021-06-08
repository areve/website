import YFinance, { yfinancedata } from "yfinance-live";

import { Buffer } from "buffer";
import {
  FinanceData,
  MarketHoursType,
  OptionType,
  QuoteType,
} from "./finance-data";
(window as any).Buffer = (window as any).Buffer || Buffer;

function getKeyByValue(object: any, value: number) {
  return Object.keys(object).find((key) => object[key] === value);
}

export function yahooStockLive(tickers: string[], callback: Function) {
  YFinance(tickers, (data: yfinancedata) => {
    const financeData: FinanceData = {
      ...data,
      marketHours: getKeyByValue(
        yfinancedata.MarketHoursType,
        data.marketHours
      ) as MarketHoursType,
      quoteType: getKeyByValue(
        yfinancedata.QuoteType,
        data.quoteType
      ) as QuoteType,
      optionsType: getKeyByValue(
        yfinancedata.OptionType,
        data.optionsType
      ) as OptionType,
    };
    callback(financeData);
  });
}
