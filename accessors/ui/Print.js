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
	createPort('Print');
}

Print.input = function* (content) {
	console.log(content);
}
