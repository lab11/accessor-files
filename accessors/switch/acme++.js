/**
 * ACme++
 * ======
 *
 * ACme++ (AC Meter ++) is a power meter with an included relay.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var coap = require('coapClient');

var ip_addr;

function setup () {
	provideInterface('/onoff');
	provideInterface('/sensor/power');
}

function* init () {
	ip_addr = getParameter('ip_addr');

	addInputHandler('/onoff/Power', inPower);
	addOutputHandler('/onoff/Power', outPower);
	addOutputHandler('/sensor/power/Power', outWatts);
}

inPower = function* (state) {
	yield* coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

outPower = function* () {
	var val = yield* coap.get('coap://['+ip_addr+']/onoff/Power');
	send('/onoff/Power', val == 'true');
}

outWatts = function* () {
	var watt = yield* rt.coap.get('coap://['+ip_addr+']/powermeter/Power');
	send('/sensor/power/Power', watt);
}
