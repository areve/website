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

export default defineComponent({
  name: "Stocks",
  setup: () => ({
    tickers: ref(["BTC-USD", "DOGE-USD"]),
    data: ref({} as { [name: string]: any }),
  }),
  mounted() {
    const stockPriceChanged = (data: any) => {
      this.data[data.id] = data;
    };
    StockSocket.addTickers(this.tickers, stockPriceChanged);
  },
});
</script>

<style scoped>
</style>
