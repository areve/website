import axios from "axios";

var baseUrl =
  "https://func-stocks-areve.azurewebsites.net/api/yahoo-finance-proxy?";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export var getCurrentData = function (ticker: string): any {
  return new Promise(async function (resolve, _reject) {
    const response = await axios.get(baseUrl + ticker + "/");
    var dataJson = response.data.match(
      new RegExp(
        '"' +
          escapeRegExp(ticker) +
          '":({"sourceInterval".*?),"[^"]*?":{"sourceInterval":'
      )
    );

    const data = JSON.parse(dataJson[1]);

    // object attempts to match format from "stocksocket"
    resolve({
      id: ticker,
      price: data.regularMarketPrice.raw,
      time: new Date().getTime(),
      currency: data.currency,
      exchange: data.exchange,
      quoteType: data.quoteType,
      marketHours: null,
      changePercent: 0,
      dayVolume: data.regularMarketVolume.raw,
      dayHigh: data.regularMarketDayHigh.raw,
      dayLow: data.regularMarketDayLow.raw,
      change: 0,
      shortName: data.shortName,
      lastSize: null,
      priceHint: data.priceHint,
      vol_24hr: null,
      volAllCurrencies: null,
      fromcurrency: data.fromCurrency,
      lastMarket: data.quoteSourceName,
      circulatingSupply: null,
      marketcap: data.marketCap.raw,
    });
  });
};

// export var getHistoricalPrices = function (startMonth, startDay, startYear, endMonth, endDay, endYear, ticker, frequency, callback, cors) {
//   if (callback === void 0) { callback = undefined; }
//   if (cors === void 0) { cors = "no-cors"; }
//   var startDate = Math.floor(Date.UTC(startYear, startMonth, startDay, 0, 0, 0) / 1000);
//   var endDate = Math.floor(Date.UTC(endYear, endMonth, endDay, 0, 0, 0) / 1000);
//   var promise = new Promise(function (resolve, reject) {
//     var requestOptions = {
//       method: "GET",
//       mode: cors
//     };
//     fetch(baseUrl + ticker + "/history?period1=" + startDate + "&period2=" + endDate + "&interval=" + frequency + "&filter=history&frequency=" + frequency, requestOptions)
//       .then(function (response) { return response.text(); })
//       .then(function (body) {
//         var prices = JSON.parse(body
//           .split('HistoricalPriceStore":{"prices":')[1]
//           .split(',"isPending')[0]);
//         resolve(prices);
//       })
//       .catch(function (error) {
//         console.log("error", error);
//         reject(error);
//         return;
//       });
//   });
//   // If a callback function was supplied return the result to the callback.
//   // Otherwise return a promise.
//   if (typeof callback === "function") {
//     promise
//       .then(function (price) { return callback(null, price); })
//       .catch(function (err) { return callback(err); });
//   }
//   else {
//     return promise;
//   }
// };
