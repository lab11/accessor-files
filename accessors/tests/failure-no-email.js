// title: Failure - no port
// author: Brad Campbell

/* Failure
 * ======================
 *
 * No email.
 */

function* init () {
  create_port('Port1');
}

Port1.input = function* (val) {
	rt.log.debug(val);
}
