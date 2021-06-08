import { yfinancedata } from "yfinance-live";

export type OptionType = keyof typeof yfinancedata.OptionType;
export type QuoteType = keyof typeof yfinancedata.QuoteType;
export type MarketHoursType = keyof typeof yfinancedata.MarketHoursType;

export interface FinanceData {
  id: string;
  price: number;
  time: number;
  currency: string;
  exchange: string;
  quoteType: QuoteType;
  marketHours?: MarketHoursType;
  changePercent: number;
  dayVolume: number;
  dayHigh?: number;
  dayLow?: number;
  change: number;
  shortName: string;
  expireDate?: number;
  openPrice?: number;
  previousClose?: number;
  strikePrice?: number;
  underlyingSymbol?: string;
  openInterest?: number;
  optionsType?: OptionType;
  miniOption?: number;
  lastSize?: number;
  bid?: number;
  bidSize?: number;
  ask?: number;
  askSize?: number;
  priceHint: number;
  vol_24hr?: number;
  volAllCurrencies?: number;
  fromcurrency: string;
  lastMarket: string;
  circulatingSupply?: number;
  marketcap: number;
}
