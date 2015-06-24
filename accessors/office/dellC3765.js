/**
 * Dell C3765DNF Printer
 * =====================
 *
 * Get information from the printer.
 *
 * @module
 * @display-name Dell C3765DNF Printer
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');

function setup () {
	createPort('Cyan', ['read']);
	createPort('Magenta', ['read']);
	createPort('Yellow', ['read']);
	createPort('Black', ['read']);
	createPort('Waste', ['read']);
	createPort('Tray1', ['read']);
}

function* init () {
	addOutputHandler('Cyan', Cyan_output);
	addOutputHandler('Magenta', Magenta_output);
	addOutputHandler('Yellow', Yellow_output);
	addOutputHandler('Black', Black_output);
	addOutputHandler('Waste', Waste_output);
	addOutputHandler('Tray1', Tray1_output);
}

function* get_status_page () {
	var url = getParameter('url');
	var html = (yield* http.get(url + '/status/status.htm')).body;
	return html;
}

// This is not a great function. But it's the fastest way to get it done.
// It should be replaced later.
function find_in_page (page, field) {
	var start = page.indexOf(field);
	console.info('start: ' + start);
	var end_tag = page.indexOf('/', start+field.length+2) - 1;
	console.info('end_tag: ' + end_tag);

	// Search for the ">" symbol
	var start_tag = 0;
	for (var i=1; i<100; i++) {
		var c = page.substr(end_tag-i, 1);
		if (c == '>') {
			start_tag = end_tag-i+1;
			break;
		}
	}
	console.info('start tag: ' + start_tag);

	return page.substr(start_tag, end_tag-start_tag);
}

function* get_status (port, search) {
	var status_html = yield* get_status_page();
	var status = find_in_page(status_html, search);
	console.log(status);
	send(port, status);
}

var Cyan_output    = function* () { yield* get_status('Cyan',    'Cyan Drum Cartridge') };
var Magenta_output = function* () { yield* get_status('Magenta', 'Magenta Drum Cartridge') };
var Yellow_output  = function* () { yield* get_status('Yellow',  'Yellow Drum Cartridge') };
var Black_output   = function* () { yield* get_status('Black',   'Black Drum Cartridge') };
var Waste_output   = function* () { yield* get_status('Waste',   'Waste Toner Box') };
var Tray1_output   = function* () { yield* get_status('Tray1',   '35%>Output Tray') };
