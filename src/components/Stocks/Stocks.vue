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

import { getCurrentData } from "./lib/yahoo-stock-prices";
console.log(getCurrentData);

getCurrentData("AAPL");
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
