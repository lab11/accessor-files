// title: Failure - no author
// email: bradjc@umich.edu

/* Failure
 * ======================
 *
 * No author.
 */

function* init () {
  create_port('Port1');
}

Port1.input = function* (val) {
	rt.log.debug(val);
}
