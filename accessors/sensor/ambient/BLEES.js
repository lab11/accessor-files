/**
 * BLEES: BLE Environmental Sensor
 * ===============================
 *
 * BLEES is a BLE sensor tag with temperature, humidity, light, and pressure
 * sensors. It transmits all sensor readings in advertisements so listeners do
 * not have to connect.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 * @display-name BLEES
 */

var ble = require('ble');

// Save the Last Known values for output ports
var LK_temperature = null;
var LK_humidity    = null;
var LK_pressure    = null;
var LK_light       = null;

function setup () {
	// provide_interface('/onoff');
	createPort('Temperature', ['read', 'event'], {
		type: 'numeric',
		units: 'degrees_celcius'
	});
	createPort('Humidity', ['read', 'event'], {
		type: 'numeric',
		units: 'relative_humidity'
	});
	createPort('Pressure', ['read', 'event'], {
		type: 'numeric',
		units: 'mbars'
	});
	createPort('Light', ['read', 'event'], {
		type: 'numeric',
		units: 'lux'
	});
}

function* init () {

	addOutputHandler('Temperature', Temperature_output);
	addOutputHandler('Humidity', Humidity_output);
	addOutputHandler('Pressure', Pressure_output);
	addOutputHandler('Light', Light_output);

	var BLEES_mac = getParameter('mac_address');

	// Get a handle to the hardware
	ble_hw = yield* ble.Central();

	// Using BLE may fail
	if (ble_hw === null) {
		console.error('Unable to get access to a BLE device.');
		return;
	}

	// Start the scan for any devices
	ble_hw.scan([], 'BLEES', BLEES_mac, function* (peripheral) {

		if (peripheral.advertisement.localName === 'BLEES' &&
			peripheral.address == BLEES_mac) {

			var msd = peripheral.advertisement.manufacturerData;

			LK_temperature = msd.readFloatLE(2);
			LK_humidity    = msd.readFloatLE(6);
			LK_light       = msd.readFloatLE(10);
			LK_pressure    = msd.readFloatLE(14);

			send('Temperature', LK_temperature);
			send('Humidity', LK_humidity);
			send('Pressure', LK_pressure);
			send('Light', LK_light);
		}

	});
}


function any_output (port, val) {
	if (val == null) {
		console.error('Could not find a BLEES sensor.');
		throw 'Could not find a BLEES sensor.';
	}

	send(port, val);
}

var Temperature_output = function () { return any_output('Temperature', LK_temperature); };
var Humidity_output    = function () { return any_output('Humidity', LK_humidity); };
var Pressure_output    = function () { return any_output('Pressure', LK_pressure); };
var Light_output       = function () { return any_output('Light', LK_light); };
