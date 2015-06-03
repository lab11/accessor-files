// name: Hue Single
// author: Brad Campbell
// email: bradjc@umich.edu
//
// Hue Light Bulb
// ==============
//
// This controls a single Hue bulb.
//
//

var http = require('httpClient');
var color = require('color');

var bulb_layout;



function* prefetch_bulb_layout () {
	var url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights';
	console.info('Fetching bulb info from bridge');
	bulb_layout = JSON.parse((yield* http.get(url)).body);
	console.info(bulb_layout);
}

function get_bulb_id () {
	var name = get_parameter('bulb_name');

	for (var key in bulb_layout) {
		if (bulb_layout[key].name == name) {
			return key;
		}
	}
}

function* get_bulb_state () {
	var bulbid = get_bulb_id();
	var url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbid;
	var state = (yield* http.get(url)).body;
	return JSON.parse(state).state;
}

function* set_bulb_parameter (params) {
	var bulbid = get_bulb_id();

	url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbid + '/state';
	// yield* http.request(url, 'PUT', null, JSON.stringify(params), 3000);
	yield* http.put(url, JSON.stringify(params));
}


function* init () {
	provide_interface('/lighting/light');
	provide_interface('/lighting/hue');

	createPort('PCB', {type: 'object'});

	console.info("Accessor::hue_single init before prefetch");
	yield* prefetch_bulb_layout();
	console.info("Accessor::hue_single init after prefetch (end of init)");
}

lighting.light.Power.input = function* (on) {
	yield* set_bulb_parameter({'on': on});
}

lighting.light.Power.output = function* () {
	var state = yield* get_bulb_state();
	return state.on;
}

lighting.hue.Color.input = function* (hex_color) {
	var hsv = color.hex_to_hsv(hex_color);
	params = {'hue': Math.round(hsv.h*182.04),
	          'sat': Math.round(hsv.s*255),
	          'bri': Math.round(hsv.v*255)}
	yield* set_bulb_parameter(params);
}

lighting.hue.Color.output = function* () {
	var state = yield* get_bulb_state();
	var c = {
		'h': state.hue / 182.04,
		's': state.sat / 255,
		'v': state.bri / 255
	}
	return color.hsv_to_hex(c);
}

lighting.hue.Brightness.input = function* (brightness) {
	yield* set_bulb_parameter({'bri': parseInt(brightness)});
}

lighting.hue.Brightness.output = function* () {
	var state = yield* get_bulb_state();
	return state.bri;
}

// Control Power, Color, and Brightness in one go.
// Input to the function is an object that looks like:
// {
//   Power: true|false,
//   Color: 'cc5400',
//   Brightness: 120
// }
PCB.input = function* (pcb) {
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
