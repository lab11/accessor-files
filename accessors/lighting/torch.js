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

function* setup () {
	provideInterface('/lighting/light');
	provideInterface('/lighting/brightness');
}

function* init () {
	ip_addr = getParameter('ip_addr');

	addInputHandler('/lighting/light.Power', Power_input);
	addOutputHandler('/lighting/light.Power', Power_output);

	addInputHandler('/lighting/brightness.Brightness', Brightness_input);
	addOutputHandler('/lighting/brightness.Brightness', Brightness_output);
}

var Power_input = function* (state) {
	yield* coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

var Power_output = function* () {
	var val = (yield* coap.get('coap://['+ip_addr+']/onoff/Power')).body.toString('utf-8');
	send('/lighting/light.Power', val == 'true');
}

var Brightness_input = function* (brightness) {
	var bri = Math.round(brightness / 2.55);
	yield* coap.post('coap://['+ip_addr+']/sdl/luxapose/DutyCycle', bri.toString());
}

var Brightness_output = function* () {
	var bri = parseInt((yield* coap.get('coap://['+ip_addr+']/sdl/luxapose/DutyCycle')).body.toString('utf-8'));
	send('/lighting/brightness.Brightness', bri * 2.55);
}
