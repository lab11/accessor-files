// name:   Print
// author: Brad Campbell
// email: bradjc@umich.edu

/* Print Accessor
 * ======================
 *
 * Strictly input, simply prints whatever is received on its port.
 */


function setup () {
	createPort('Print');
}

Print.input = function* (content) {
	console.log(content);
}
