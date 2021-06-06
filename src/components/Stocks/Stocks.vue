<template>
  <article>
    <h1>Stocks</h1>
    <p>
      This is experiment of showing some stock prices, and updating
      continuously. It uses unsupported ways of getting data from yahoo, so it's
      good for experimental purposes only. And it relies on a tiny Azure
      Function I wrote, because of CORS issues with scraping yahoo's page.
    </p>

    <div class="cards">
      <div v-for="item in sortedData" :key="item.id" class="card">
        <h2>{{ item.id }}</h2>
        <p>{{ item.shortName }} - {{ item.quoteType }}</p>
        <dl>
          <dt>Price</dt>
          <dd>{{ item.price.toFixed(5) }} {{ item.currency }}</dd>
        </dl>
        <dl>
          <dt>Day Range</dt>
          <dd>{{ item.dayLow.toFixed(5) }} - {{ item.dayHigh.toFixed(5) }}</dd>
        </dl>
        <dl>
          <dt>Last Updated</dt>
          <dd>{{ new Date(item.time).toLocaleString() }}</dd>
        </dl>
      </div>
    </div>
    <p>The Azure Function source code:</p>
    <pre>
        const axios = require("axios");
        module.exports = async function (context, req) {
            const url = 'https://finance.yahoo.com/quote/' + context.req.url.replace(/^.*?\?/, '');
            const response = await axios.get(url);
            context.log(response.status + ' ' + url);
            context.res.send(response.data);
        };
        </pre
    >
  </article>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import * as StockSocket from "./lib/stocksocket";

import * as yahooStockPrices from "./lib/yahoo-stock-prices";

export default defineComponent({
  name: "Stocks",
  setup: () => ({
    tickers: ref(["BTC-USD", "DOGE-USD", "GME"]),
    data: ref({} as { [name: string]: any }),
  }),
  async mounted() {
    const stockPriceChanged = (data: any) => {
      this.data[data.id] = data;
    };

    this.tickers.forEach(async (ticker) => {
      const data = await yahooStockPrices.getCurrentData(ticker);
      this.data[data.id] = data;
    });

    StockSocket.addTickers(this.tickers, stockPriceChanged);
  },
  computed: {
    sortedData(): any[] {
      return Object.values(this.data).sort((a: any, b: any) =>
        a.id === b.id ? 0 : a.id > b.id ? 1 : -1
      );
    },
  },
});
</script>

<style scoped>
.cards {
  display: flex;
  flex-flow: row wrap;
  margin: -0.5em;
}
.card {
  min-width: 10em;
  margin: 0.5em;
}
</style>
