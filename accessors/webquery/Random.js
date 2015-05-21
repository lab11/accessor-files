// author:  Brad Campbell
// email:   bradjc@umich.edu
//
// Accessor for the Random.org API
// ===============================
//
// Easy way to retrieve random numbers

var API_KEY = '40c37525-22a1-4b69-91ea-ed47b33dc736'
var request_id = 1;

function init() {
  create_port('RandomInteger', {
    type: 'numeric',
    min: 0,
    max: 999999
  });
}

RandomInteger.output = function* () {
  var msg = {
    jsonrpc: '2.0',
    method: 'generateIntegers',
    params: {
      apiKey: API_KEY,
      n: 1,
      min: 0,
      max: 999999
    },
    id: request_id
  };

  var resp = yield* rt.http.request('https://api.random.org/json-rpc/1/invoke', 'GET', null, msg, 0);
  rt.log.log(resp);

  request_id += 1;
}
