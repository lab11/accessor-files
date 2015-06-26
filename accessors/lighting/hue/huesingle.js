/**
 * Hue Light Bulb
 * ==============
 *
 * This controls a single Hue bulb.
 *
 * @module
 * @display-name Hue Single
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');
var color = require('color');

var bulb_layout;



function* prefetch_bulb_layout () {
	var url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights';
	console.info('Fetching bulb info from bridge');
	bulb_layout = JSON.parse((yield* http.get(url)).body);
	console.info(bulb_layout);
}

function get_bulb_id () {
	var name = getParameter('bulb_name');

	for (var key in bulb_layout) {
		if (bulb_layout[key].name == name) {
			return key;
		}
	}
}

function* get_bulb_state () {
	var bulbid = get_bulb_id();
	var url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbid;
	var state = (yield* http.get(url)).body;
	return JSON.parse(state).state;
}

function* set_bulb_parameter (params) {
	var bulbid = get_bulb_id();

	url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbid + '/state';
	yield* http.put(url, JSON.stringify(params));
}

function setup () {
	provideInterface('/lighting/hue');

	createPortBundle('PCB', ['Power', 'Color', 'Brightness']);
}

function* init () {
	addInputHandler('Power', Power_input);
	addOutputHandler('Power', Power_output);
	addInputHandler('Color', Color_input);
	addOutputHandler('Color', Color_output);
	addInputHandler('Brightness', Brightness_input);
	addOutputHandler('Brightness', Brightness_output);

	addInputHandler('PCB', PCB_input);

	console.info("Accessor::hue_single init before prefetch");
	yield* prefetch_bulb_layout();
	console.info("Accessor::hue_single init after prefetch (end of init)");
}

var Power_input = function* (on) {
	yield* set_bulb_parameter({'on': on});
}

var Power_output = function* () {
	var state = yield* get_bulb_state();
	send('Power', state.on);
}

var Color_input = function* (hex_color) {
	var hsv = color.hex_to_hsv(hex_color);
	params = {'hue': Math.round(hsv.h*182.04),
	          'sat': Math.round(hsv.s*255),
	          'bri': Math.round(hsv.v*255)}
	yield* set_bulb_parameter(params);
}

var Color_output = function* () {
	var state = yield* get_bulb_state();
	var c = {
		'h': state.hue / 182.04,
		's': state.sat / 255,
		'v': state.bri / 255
	}
	send('Color', color.hsv_to_hex(c));
}

var Brightness_input = function* (brightness) {
	yield* set_bulb_parameter({'bri': parseInt(brightness)});
}

var Brightness_output = function* () {
	var state = yield* get_bulb_state();
	send('Brightness', state.bri);
}

// Control Power, Color, and Brightness in one go.
// Input to the function is an object that looks like:
// {
//   Power: true|false,
//   Color: 'cc5400',
//   Brightness: 120
// }
var PCB_input = function* (pcb) {
	var p = pcb.Power;
	var c = pcb.Color;
	var hsv = color.hex_to_hsv(c);
	var b = pcb.Brightness;

	var params = {};
	params['on']  = p;
	params['hue'] = Math.round(hsv.h*182.04);
	params['sat'] = Math.round(hsv.s*255);
	params['bri'] = parseInt(b);

	yield* set_bulb_parameter(params);
}
