<template>
  <article>
    <h1>Stocks</h1>
    <p>
      This is experiment of showing some stock prices, and updating
      continuously. It uses unsupported ways of getting data from Yahoo, so it's
      good for experimental purposes only. And it relies on a tiny Azure
      Function I wrote, because of CORS issues with scraping Yahoo's page.
    </p>

    <div class="cards">
      <div v-for="item in sortedData" :key="item.id" class="card">
        <h2>{{ item.id }}</h2>
        <p>{{ item.shortName }} - {{ item.quoteType }}</p>
        <dl>
          <dt>Price</dt>
          <dd>{{ item.price?.toPrecision(5) }} {{ item.currency }}</dd>
        </dl>
        <dl>
          <dt>Day Range</dt>
          <dd>
            {{ item.dayLow?.toPrecision(5) }} -
            {{ item.dayHigh?.toPrecision(5) }}
          </dd>
        </dl>
        <dl>
          <dt>Last Updated</dt>
          <dd>{{ new Date(item.time).toLocaleString() }}</dd>
        </dl>
      </div>
    </div>
    <p>The Azure Function source code:</p>
    <pre><code>const axios = require("axios");
module.exports = async function (context, req) {
  const url =
    `https://finance.yahoo.com/quote/${context.req.url.replace(/^.*?\?/, "")}`;
  const response = await axios.get(url);
  context.log(`${response.status} ${url}`);
  context.res.send(response.data);
};</code></pre>
  </article>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import { getCurrentData } from "./lib/yahoo-stocks-query";
import { yahooStockLive } from "./lib/yahoo-stocks-live";

export default defineComponent({
  name: "Stocks",
  setup: () => ({
    tickers: ref(["BTC-USD", "DOGE-USD", "GME"]),
    data: ref({} as { [name: string]: any }),
  }),
  async mounted() {
    this.tickers.forEach(
      async (ticker) => (this.data[ticker] = await getCurrentData(ticker))
    );

    yahooStockLive(this.tickers, (data: any) => (this.data[data.id] = data));
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
