// name:   Print
// author: Pat Pannuto
// email:  ppannuto@umich.edu

/* Say Accessor
 * ============
 *
 * Strictly input, speaks aloud whatever is received on its port.
 */


function* init () {
	create_port('Say');
}

Say.input = function* (content) {
	yield* rt.text_to_speech.say(content);
}
