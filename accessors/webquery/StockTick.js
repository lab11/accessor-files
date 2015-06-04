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

var stock_symbol = 'YHOO';

function init() {
  create_port('StockSymbol', {
    display_name: "Stock Symbol",
    default: "YHOO",
    description: "The stock symbol."
  });
  create_port('Price', {
    type: "numeric",
    units: "currency.usd",
    description: "The most recent stock price (bid)."
  });
}

StockSymbol.input = function* (symbol) {
  stock_symbol = symbol;
}

Price.output = function* () {
  rt.log.debug("StockTick StockSymbol start");
  var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22"+ stock_symbol + "%22)%0A%09%09&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json";
  var record = yield* rt.http.get(url);
  var json = JSON.parse(record);
  if (json.query.results == null) {
    rt.log.error("Stock query failed");
  } else {
    var tick = parseFloat(json.query.results.quote.LastTradePriceOnly);
    return tick;
  }
  rt.log.debug("StockTick StockSymbol end");
}
