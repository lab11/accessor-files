/**
 * Torch
 * ======
 *
 * Torch is part of the SDL platform for controlling LEDs.
 *
 * @module
 * @display-name Torch / SDL Lights
 * @author Brad Campbell <bradjc@umich.edu>
 */

var coap = require('coapClient');

var ip_addr;

function* init () {
	// INTERFACES
	provideInterface('/lighting/light');
	provideInterface('/lighting/brightness');

	ip_addr = getParameter('ip_addr');
}

lighting.light.Power.input = function* (state) {
	yield* coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

lighting.light.Power.output = function* () {
	var val = (yield* coap.get('coap://['+ip_addr+']/onoff/Power')).payload.toString('utf-8');
	return val == 'true';
}

lighting.brightness.Brightness.input = function* (brightness) {
	var bri = Math.round(brightness / 2.55);
	yield* coap.post('coap://['+ip_addr+']/sdl/luxapose/DutyCycle', bri.toString());
}

lighting.brightness.Brightness.output = function* () {
	var bri = parseInt((yield* coap.get('coap://['+ip_addr+']/sdl/luxapose/DutyCycle')).payload.toString('utf-8'));
	return bri * 2.55;
}
