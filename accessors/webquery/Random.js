/**
 * Accessor for the Random.org API
 * ===============================
 *
 * Easy way to retrieve random numbers
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');

var API_KEY = '40c37525-22a1-4b69-91ea-ed47b33dc736'
var request_id = 1;

// var saved_random_ints = [];

function setup () {
  createPort('RandomInteger', ['read'], {
    type: 'numeric',
    min: 0,
    max: 999999
  });
  createPort('RandomUUID', ['read']);
}

function* init () {
  addOutputHandler('RandomInteger', out_RandomInteger);
  addOutputHandler('RandomUUID', out_RandomUUID);
}

function* get_single (method, params) {
  var msg = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: request_id
  };
  request_id += 1;

  var resp = yield* http.post('https://api.random.org/json-rpc/1/invoke', JSON.stringify(msg));
  var val = JSON.parse(resp.body).result.random.data[0];

  return val;
}

out_RandomInteger = function* () {
  var method = 'generateIntegers';
  var params = {
      apiKey: API_KEY,
      n: 1,
      min: 0,
      max: 999999
  };

  var rand = yield* get_single(method, params);
  send('RandomInteger', rand);
}

// TODO
//RandomInteger.observe

out_RandomUUID = function* () {
  var method = 'generateUUIDs';
  var params = {
    apiKey: API_KEY,
    n: 1
  };

  var rand = yield* get_single(method, params);
  send('RandomUUID', rand);
}
