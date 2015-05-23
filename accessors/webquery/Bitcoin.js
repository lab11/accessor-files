// author: Brad Campbell
// email: bradjc@umich.edu

/* Bitcoin Accessor
 * ======================
 *
 * Get information about Bitcoin.
 *
 * See https://blockchain.info/api/api_websocket for info on the API.
 */

var url = '';
var tag = '';

function* init () {
  create_port('Price', {
    type: 'numeric',
    units: 'currency_usd'
  });
  create_port('Transactions', {
    type: 'object'
  });
}

Price.output = function* () {
  var ticker = yield* rt.http.get('https://blockchain.info/ticker');
  return parseFloat(JSON.parse(ticker).USD.last).toFixed(2);
}

Transactions.observe = function* () {
  var ws = yield* rt.websocket.connect('wss://ws.blockchain.info/inv');

  function ws_data (data) {
    send('Transactions', JSON.parse(data));
  }

  function ws_error (err) {
    rt.log.error(err);
  }

  function ws_close () {
    rt.log.warn('WebSocket connection closed.');
  }

  ws.subscribe(ws_data, ws_error, ws_close);
  ws.send({op:'unconfirmed_sub'});
}
