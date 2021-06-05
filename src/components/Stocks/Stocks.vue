<template>
  <article>
    <h1>Stocks</h1>
    <p>I'm going to see if I can show stock prices on a page.</p>
    <pre>{{ tickers }}</pre>
    <pre>{{ data }}</pre>
  </article>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import * as StockSocket from "stocksocket";
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

import * as yahooStockAPI from "yahoo-stock-api";
async function main() {
  const startDate = new Date("08/21/2020");
  const endDate = new Date("08/26/2020");
  console.log(
    await yahooStockAPI.getHistoricalPrices(startDate, endDate, "AAPL", "1d")
  );
}
main();
async function main2() {
  console.log(await yahooStockAPI.getSymbol("AAPL"));
}
main2();

export default defineComponent({
  name: "Stocks",
  setup: () => ({
    tickers: ref(["TSLA", "NNDM", "AAPL", "MARA", "DOGE-USD"]),
    data: ref({}),
  }),
  mounted() {
    const stockPriceChanged = (data: any) => {
      console.log(data);
      this.data = data;
    };
    StockSocket.addTickers(this.tickers, stockPriceChanged);
  },
});
</script>

<style scoped>
</style>
