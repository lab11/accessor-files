/**
 * Notti
 * =====
 *
 * BLE enabled LED indicator.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 * @display-name Notti
 */

var ble = require('ble');

var NOTTI_NAME = 'Notti';

// var NOTTI_SERVICE_UUID = '0000fff000001000800000805f9b34fb';
var NOTTI_SERVICE_UUID = 'fff0';

// var NOTTI_CHAR_COLOR_UUID = '0000fff300001000800000805f9b34fb';
var NOTTI_CHAR_COLOR_UUID = 'fff3';

var ble_hw = null;
var notti_peripheral = null;
var scan_token = null;

var notti_characteristic = null;

// Save the color so fade can look good
var last_color = 'ffffff';

function setup () {
	provideInterface('/onoff');
	provideInterface('/lighting/rgb');

	createPort('Fade', ['write'], {
		type: 'color'
	});
}

function* init () {

	// Connect functions
	addInputHandler('Power', inPower);
	addInputHandler('Color', inColor);
	addInputHandler('Fade', inFade);

	// Get a handle to the hardware
	ble_hw = yield* ble.Central();

	// Using BLE may fail
	if (ble_hw === null) {
		console.error('Unable to get access to a BLE device.');
		return;
	}

	scan_token = ble_hw.stayConnected(NOTTI_SERVICE_UUID, NOTTI_NAME, null, function* (peripheral) {

		notti_peripheral = peripheral;

		// Need to get a handle to the correct characteristic
		var services = yield* ble_hw.discoverServices(peripheral, [NOTTI_SERVICE_UUID]);

		var characteristics = yield* ble_hw.discoverCharacteristics(
								services[0], [NOTTI_CHAR_COLOR_UUID]);

		notti_characteristic = characteristics[0];


	}, function () {
		info('disconnect :(')
		notti_characteristic = null;
	});

}

function color_to_rgb (color) {
	var r = parseInt(color.slice(0,2), 16);
	var g = parseInt(color.slice(2,4), 16);
	var b = parseInt(color.slice(4,6), 16);

	return [r, g, b];
}

inPower = function* (state) {
	if (notti_characteristic == null) {
		console.error('No connected Notti. Cannot write.');
		throw 'No connected Notti. Cannot write.';
	}

	if (state) {
		var channels = color_to_rgb(last_color);
	} else {
		var channels = color_to_rgb('000000');
	}

	var cmd = [0x06, 0x01].concat(channels);
	yield* ble_hw.writeCharacteristic(notti_characteristic, cmd);
}

inColor = function* (color) {
	if (notti_characteristic == null) {
		console.error('No connected Notti. Cannot write.');
		throw 'No connected Notti. Cannot write.';
	}

	last_color = color;

	var channels = color_to_rgb(color);
	var cmd = [0x06, 0x01].concat(channels);
	yield* ble_hw.writeCharacteristic(notti_characteristic, cmd);
}

inFade = function* (color) {
	if (notti_characteristic == null) {
		console.error('No connected Notti. Cannot write.');
		throw 'No connected Notti. Cannot write.';
	}

	var channels1 = color_to_rgb(last_color);
	var channels2 = color_to_rgb(color);

	last_color = color;

	var cmd = ([0x09, 0x08].concat(channels1)).concat(channels2);
	yield* ble_hw.writeCharacteristic(notti_characteristic, cmd);
}

wrapup = function* () {
	if (ble_hw != null && notti_peripheral != null && scan_token != null) {
		ble_hw.scanStop(scan_token);
		yield* ble_hw.disconnect(notti_peripheral);
	}
}
