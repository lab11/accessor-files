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

	addInputHandler('/onoff.Power', inPower);
	addOutputHandler('/onoff.Power', outPower);
	addOutputHandler('/sensor/power.Power', outWatts);
}

function req_succedded (status_code) {
	var sc = parseFloat(status_code);

	if (sc >= 2.0 && sc < 3.0) {
		return true;
	} else {
		return false;
	}
}

inPower = function* (state) {
	yield* coap.post('coap://['+ip_addr+']/onoff/Power', (state)?'true':'false');
}

outPower = function* () {
	var req = yield* coap.get('coap://['+ip_addr+']/onoff/Power');

	if (!req_succedded(req.statusCode)) {
		req = yield* coap.get('coap://['+ip_addr+']/onoffdevice/Power');
		if (!req_succedded(req.statusCode)) {
			throw 'Could not get power state.';
		}
	}

	var val = req.body.toString('utf-8');
	send('/onoff.Power', val == 'true');
}

outWatts = function* () {
	var req = yield* coap.get('coap://['+ip_addr+']/powermeter/Power');
	if (!req_succedded(req.statusCode)) {
		throw 'Could not get power.';
	}

	var watt = req.body.toString('utf-8');
	if (watt.length > 6 && watt.substring(0, 6) == 'Power=') {
		throw 'This old ACme++ does not support power.';
	}
	send('/sensor/power.Power', watt);
}
