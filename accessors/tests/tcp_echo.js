/**
 * TCP Echo Accessor
 * ======================
 *
 * Writes a string from its `Message` port to a TCP echo server. The server
 * prepends the request number and responds with a delay. The response is
 * captured as an asynchronous event and sets the `Response` output port.
 *
 * @module
 * @author Pat Pannuto <ppannuto@umich.edu>
 */

var socket = require('socket');

var s;
var msg = "XXX_NO_MESSAGES_YET_XXX";

function rx_callback(message) {
	console.info("RX: " + message);
	msg = message;
}

function setup () {
	createPort('Message', ['write']);
	createPort('Response', ['read']);
}

function* init () {
	addInputHandler('Message', Message_input);
	addOutputHandler('Response', Response_output);

	s = yield* socket.socket('AF_INET', 'SOCK_STREAM');
	s.bind(rx_callback);
	yield* s.connect(['127.0.0.1', 22222]);
}

var Message_input = function* (content) {
	yield* s.send(content);
}

var Response_output = function* () {
	send('Response', msg);
}

