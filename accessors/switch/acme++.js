/**
 * ACme++
 * ======
 *
 * ACme++ (AC Meter ++) is a power meter with an included relay.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var ip_addr;

function* init () {
	// INTERFACES
	provide_interface('/onoff');
	provide_interface('/sensor/power');

	ip_addr = get_parameter('ip_addr');
}

onoff.Power.input = function* (state) {
	yield* rt.coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

onoff.Power.output = function* () {
	var val = yield* rt.coap.get('coap://['+ip_addr+']/onoff/Power');
	return val == 'true';
}

sensor.power.Power.output = function* () {
	return yield* rt.coap.get('coap://['+ip_addr+']/powermeter/Power');
}
