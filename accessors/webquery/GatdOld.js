/**
 * Pull From GATDv0.1
 * ===========================
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var gatd_old = require('gatdOld');

function setup () {
  // Create a single output observe port to publish data from the queue to.
  createPort('Data', ['event'], {
    type: 'object'
  });
}

function* init () {
  var gatd_url = getParameter('gatd_url');
  var query = JSON.parse(getParameter('gatd_query'));

  // Connect to the GATD
  var gatd_conn = yield* gatd_old.Client(gatd_url);

  // Setup a simple listener that will create a queue to the given exchange
  // with the given routing key and call `callback` every time a data packet
  // comes in.
  gatd_conn.query(query, function (value) {
    send('Data', value);
  });
}
