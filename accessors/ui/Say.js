/**
 * Say Accessor
 * ============
 *
 * Strictly input, speaks aloud whatever is received on its port.
 *
 * @module
 * @author Pat Pannuto <ppannuto@umich.edu>
 */



function* init () {
	create_port('Say');
}

Say.input = function* (content) {
	yield* rt.text_to_speech.say(content);
}
