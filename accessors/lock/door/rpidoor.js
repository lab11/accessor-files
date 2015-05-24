/* author: Pat Pannuto
 * email: ppannuto@umich.edu
 * name: Raspberry Pi Door
 *
 * Accessor for a Door Controller by a Raspberry Pi
 * ================================================
 *
 * We should post the TinyOS app we use for door control to github, so that this
 * description can point to it. File that on the todo list.
 */

var currently_locked = true;

function init () {

	// INTERFACES
	provide_interface('/lock/door', {
		'/lock.Lock': Lock
	});

	currently_locked = true;
}

Lock.input = function* (lock) {
	if (lock) return;

	try {
		var s = yield* rt.socket.socket('AF_INET6', 'SOCK_DGRAM');
	} catch (err) {
		rt.log.error("Failed to connect to socket: " + err);
		// set_to_locked();
		return;
	}
	var host = get_parameter('host');
	var port = get_parameter('port', 4999);
	var pass = get_parameter('password');
	try {
		yield* s.sendto(pass, [host, port]);
	} catch (err) {
		rt.log.error("Failed to send open pacekt: " + err);
		currently_locked = true;
		return;
	}
	currently_locked = false;

	rt.time.run_later(get_parameter('unlock_time_in_ms', 2000), function () {
		currently_locked = true;
	});
}

Lock.output = function () {
	// The lock has no queryable interface. It only stays unlocked for 2s though,
	// so it's a reasonably safe bet that if we didn't unlock it, neither did
	// anyone else. As such, we emulate the output using only our imperfect knowledge.
	return currently_locked;
}
