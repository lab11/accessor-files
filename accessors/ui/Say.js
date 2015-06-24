/**
 * Say Accessor
 * ============
 *
 * Strictly input, speaks aloud whatever is received on its port.
 *
 * @module
 * @author Pat Pannuto <ppannuto@umich.edu>
 */

var tts = require('textToSpeech');

function setup () {
	createPort('Say', ['write']);
}

function* init () {
	addInputHandler('Say', say);
}

var say = function* (content) {
	yield* tts.say(content);
}
