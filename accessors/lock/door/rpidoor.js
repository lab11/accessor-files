/**
 * Accessor for a Door Controller by a Raspberry Pi
 * ================================================
 *
 * We should post the TinyOS app we use for door control to github, so that this
 * description can point to it. File that on the todo list.
 *
 * @module
 * @display-name Raspberry Pi Door
 * @author Pat Pannuto <ppannuto@umich.edu>
 */

var socket = require('socket');

var currently_locked = true;

function setup () {
	provideInterface('/lock/door');
}

function init () {
	addInputHandler('/lock/door.Lock', Lock_input);
	addOutputHandler('/lock/door.Lock', Lock_output);
}

var Lock_input = function* (lock) {
	if (lock) return;

	try {
		var s = yield* socket.socket('AF_INET6', 'SOCK_DGRAM');
	} catch (err) {
		rt.log.error("Failed to connect to socket: " + err);
		// set_to_locked();
		return;
	}
	var host = getParameter('host');
	var port = getParameter('port', 4999);
	var pass = getParameter('password');
	try {
		yield* s.sendto(pass, [host, port]);
	} catch (err) {
		rt.log.error("Failed to send open pacekt: " + err);
		currently_locked = true;
		return;
	}
	currently_locked = false;

	setTimeout(function () {
		currently_locked = true;
	}, getParameter('unlock_time_in_ms', 2000));
}

var Lock_output = function () {
	// The lock has no queryable interface. It only stays unlocked for 2s though,
	// so it's a reasonably safe bet that if we didn't unlock it, neither did
	// anyone else. As such, we emulate the output using only our imperfect knowledge.
	return currently_locked;
}
