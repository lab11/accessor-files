/**
 * Stock Price Lookup Accessor
 * ===========================
 *
 * This accessor, when fired, reads the most recent bid price for the specified
 * stock symbol from a Yahoo server.
 *
 * @module webquery/StockTick
 * @author Edward A. Lee <eal@eecs.berkeley.edu>
 */

var http = require('httpClient');

function setup () {
  createPort('StockSymbol', ['write'], {
    display_name: "Stock Symbol",
    value: "YHOO",
    description: "The stock symbol."
  });
  createPort('Price', ['read', 'event'], {
    type: "numeric",
    units: "currency.usd",
    description: "The most recent stock price (bid)."
  });
}

function* init() {
  addInputHandler('StockSymbol', stock_symbol);
  addOutputHandler('Price', price);
}

function* getPrice () {
  var symbol = get('StockSymbol');
  var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22"+ symbol + "%22)%0A%09%09&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json";
  var record = (yield* http.get(url)).body;
  var json = JSON.parse(record);
  if (json.query.results == null) {
    return null;
  } else {
    var tick = parseFloat(json.query.results.quote.LastTradePriceOnly);
    return tick;
  }
}

stock_symbol = function* (symbol) {
  stock_symbol = symbol;
  var p = yield* getPrice();
  send('Price', p);
}

price = function* () {
  var p = yield* getPrice();
  send('Price', p);
}
