/**
 * Bitcoin Accessor
 * ======================
 *
 * Get information about Bitcoin.
 *
 * See https://blockchain.info/api/api_websocket for info on the API.
 *
 * @module webquery/Bitcoin
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');
var websocket = require('webSocket');

function setup () {
  createPort('Price', ['read'], {
    type: 'numeric',
    units: 'currency_usd'
  });
  createPort('Transactions', ['event'], {
    type: 'object'
  });
}

function* init () {

  addOutputHandler('Price', out_Price)

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

out_Price = function* () {
  var ticker = yield* http.get('https://blockchain.info/ticker');
  var price = parseFloat(JSON.parse(ticker.body).USD.last).toFixed(2);
  send('Price', price);
}
