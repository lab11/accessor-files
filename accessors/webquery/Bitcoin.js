// author: Brad Campbell
// email: bradjc@umich.edu

/* Bitcoin Accessor
 * ======================
 *
 * Get information about Bitcoin.
 *
 * See https://blockchain.info/api/api_websocket for info on the API.
 */

var http = require('httpClient');
var websocket = require('webSocket');

function* init () {
  createPort('Price', {
    type: 'numeric',
    units: 'currency_usd'
  });
  createPort('Transactions', {
    type: 'object'
  });
}

Price.output = function* () {
  var ticker = yield* http.get('https://blockchain.info/ticker');
  return parseFloat(JSON.parse(ticker.body).USD.last).toFixed(2);
}

Transactions.observe = function* () {
  var ws = new websocket.Client('wss://ws.blockchain.info/inv');

  ws.on('message', function (data, flags) {
    send('Transactions', JSON.parse(data));
  });

  ws.on('error', function (err) {
    console.error(err);
  });

  ws.on('close', function () {
    console.warn('btc websocket closed.');
  });

  ws.on('open', function () {
    ws.send(JSON.stringify({'op':'unconfirmed_sub'}));
  });
}
