// author:  Brad Campbell
// email:   bradjc@umich.edu
//
// Accessor for the Random.org API
// ===============================
//
// Easy way to retrieve random numbers

var http = require('httpClient');

var API_KEY = '40c37525-22a1-4b69-91ea-ed47b33dc736'
var request_id = 1;

// var saved_random_ints = [];

function setup () {
    createPort('RandomInteger', {
    type: 'numeric',
    min: 0,
    max: 999999
  });
  createPort('RandomUUID');
}

function init () {

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

RandomInteger.output = function* () {
  var method = 'generateIntegers';
  var params = {
      apiKey: API_KEY,
      n: 1,
      min: 0,
      max: 999999
  };

  return yield* get_single(method, params);
}

// TODO
//RandomInteger.observe

RandomUUID.output = function* () {
  var method = 'generateUUIDs';
  var params = {
    apiKey: API_KEY,
    n: 1
  };

  return yield* get_single(method, params);
}
