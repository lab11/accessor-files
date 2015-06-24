/**
 * Pull From a RabbitMQ Exchange
 * =============================
 *
 * This accessor connects to a RabbitMQ exchange and outputs data from the
 * connected queue to the observe port.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var amqp = require('rabbitmq');

function setup () {
  // Create a single output observe port to publish data from the queue to.
  createPort('Data', ['event'], {
    type: 'object'
  });
}

function data_callback (val) {
  send('Data', val);
}

function* init () {
  var amqp_url = getParameter('amqp_url');
  var exchange = getParameter('amqp_exchange');
  var routing_key = getParameter('amqp_routing_key');

  // Connect to the RabbitMQ server
  var amqp_conn = yield* amqp.Client(amqp_url);

  // Setup a simple listener that will create a queue to the given exchange
  // with the given routing key and call `data_callback` every time a data packet
  // comes in.
  amqp_conn.subscribe(exchange, routing_key, data_callback);
}
