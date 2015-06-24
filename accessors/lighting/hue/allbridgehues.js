/**
 * Hue Light Bulbs
 * ===============
 *
 * This controls all of the hues behind a bridge.
 *
 * @module
 * @display-name All Hues on a Bridge
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');
var color = require('color');

var bulbids = [];

function* on_each (body) {
	for (var bulbid in bulbids) {
		url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbid + '/state';
		yield* http.put(url, JSON.stringify(body));
	}
}

function setup () {
	provideInterface('/lighting/light');
	provideInterface('/lighting/hue');

	createPort('Bridge', ['read']);
}

function* init () {
	addInputHandler('Power', Power_input);
	addOutputHandler('Power', Power_output);
	addInputHandler('Color', Color_input);
	addOutputHandler('Color', Color_output);
	addInputHandler('Brightness', Brightness_input);
	addOutputHandler('Brightness', Brightness_output);

	addOutputHandler('Bridge', Bridge_output);

	// Populate the list of known bulbs
	var url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights';
	var data = JSON.parse((yield* http.get(url)).body);
	for (var key in data) {
		bulbids.push(key);
	}
}

var Power_input = function* (on) {
	yield* on_each({'on': on});
}

var Power_output = function* () {
	var on = false;

	for (var i=0; i<bulbids.length; i++) {
		url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbids[i];
		var bulb_state = JSON.parse((yield* http.get(url)).body);
		if (bulb_state.state.on) {
			on = true;
		}
	}

	send('Power', on);
}

var Color_input = function* (hex_color) {
	hsv = color.hex_to_hsv(hex_color);
	params = {'hue': Math.round(hsv.h*182.04),
	          'sat': Math.round(hsv.s*255),
	          'bri': Math.round(hsv.v*255)}
	yield* on_each(params);
}

var Color_output = function* () {
	if (bulbids.length > 0) {
		// There are two cases here.
		// 1. All the lights are the same color. So we ask the first and
		//    return its color.
		// 2. They are not all the same color. Well then who knows what we should
		//    return so we just return the color of the first light again.
		url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbids[0];
		var bulb_state = JSON.parse((yield* http.get(url)).body);
		var color = {
			'h': bulb_state.state.hue / 182.04,
			's': bulb_state.state.sat / 255,
			'v': bulb_state.state.bri / 255
		}
		send('Color', color.hsv_to_hex(color));
	} else {
		// Need to return something...
		send('Color', '000000');
	}
}

var Brightness_input = function* (brightness) {
	yield* on_each({'bri': parseInt(brightness)});
}

var Brightness_output = function* () {
	if (bulbids.length > 0) {
		url = getParameter('bridge_url') + '/api/' + getParameter('username') + '/lights/' + bulbids[0];
		var bulb_state = JSON.parse((yield* http.get(url)).body);
		send('Brightness', bulb_state.state.bri);
	} else {
		// Need to return something...
		send('Brightness', 0);
	}
}

var Bridge_output = function* () {
	send('Bridge', getParameter('bridge_url'));
}
