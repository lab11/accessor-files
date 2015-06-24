/**
 * Light Control for 4908 Ceiling Lights
 * =====================================
 *
 * Turn the LED lights in 4908 on and off. This only applies to the main
 * overheads.
 *
 * @module
 * @display-name 4908 Ceiling Lights
 * @author Brad Campbell <bradjc@umich.edu>
 */

var amqp = require('rabbitmq');
var conn = null;

function setup () {
	provideInterface('/lighting/light');
	// createPort('Power', ['write']);
}

function* init () {
	addInputHandler('Power', Power_input);

	conn = yield* amqp.Client(getParameter('rabbitmq_url'));
}

var Power_input = function* (state) {
	if (null) {
		throw 'Could not connect to RabbitMQ';
	}

	var location = getParameter('location_str');
	var data = {
		override: false,
		delay: 30*60*1000,
		delayed_msg: true,
		location_str: location
	};

	if (state) {
		data.event_str = 'Room lights on';
	} else {
		data.event_str = 'Room lights off';
	}

	yield* conn.publish(getParameter('rabbitmq_exchange'),
	                    getParameter('rabbitmq_routing_key'),
	                    JSON.stringify(data));
}
