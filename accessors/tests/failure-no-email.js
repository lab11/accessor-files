/**
 * Failure
 * ======================
 *
 * No email.
 *
 * @module
 * @author Brad Campbell
 */

function setup () {
	createPort('Port1', ['write']);
}

function* init () {
  addInputHandler('Port1', Port1_input);
}

var Port1_input = function* (val) {
	console.log(val);
}