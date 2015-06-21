/**
 * Print to a Real Printer
 * =======================
 *
 * Print a string on paper.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var printer = require('printer');

var printer_obj = null;

function setup () {
	createPort('PrinterURL', ['write']);
	createPort('String', ['write']);
}

function* init () {
	addInputHandler('PrinterURL', in_url);
	addInputHandler('String', in_str);
}

var in_url = function (url) {
	printer_obj = new printer.Printer(url);
}

var in_str = function* (str) {
	if (printer_obj === null) {
		console.error('No printer. Cannot print.');
		throw 'No printer. Cannot print.';
	}

	console.log('Going to make a hard copy of ' + str);

	var response = yield* printer_obj.print(str);
	console.log(response);
}
