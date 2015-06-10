/**
 * Print Accessor
 * ======================
 *
 * Strictly input, simply prints whatever is received on its port.
 *
 * @module ui/Print
 * @author Brad Campbell <bradjc@umich.edu>
 */


function setup () {
	createPort('Print', ['write']);
}

function* init () {
	addInputHandler('Print', in_Print);
}

in_Print = function* (content) {
	console.log(content);
}
