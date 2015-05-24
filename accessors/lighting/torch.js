// name:   Torch / SDL Lights
// author: Brad Campbell
// email:  bradjc@umich.edu

// Torch
// ======
//
// Torch is part of the SDL platform for controlling LEDs.
//

var ip_addr;

function* init () {
	// INTERFACES
	provide_interface('/lighting/light');
	provide_interface('/lighting/brightness');

	ip_addr = get_parameter('ip_addr');
}

lighting.light.Power.input = function* (state) {
	yield* rt.coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

lighting.light.Power.output = function* () {
	var val = yield* rt.coap.get('coap://['+ip_addr+']/onoff/Power');
	return val == 'true';
}

lighting.brightness.Brightness.input = function* (brightness) {
	var bri = Math.round(brightness / 2.55);
	yield* rt.coap.post('coap://['+ip_addr+']/sdl/luxapose/DutyCycle', bri);
}

lighting.brightness.Brightness.output = function* () {
	var bri = parseInt(yield* rt.coap.get('coap://['+ip_addr+']/sdl/luxapose/DutyCycle'));
	return bri * 2.55;
}
