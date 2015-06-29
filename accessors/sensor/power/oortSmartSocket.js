/**
 * Oort Smart Socket
 * =================
 *
 * The Oort Smart Socket is a BLE-based power meter and load switch.
 * When connected, the Oort provides power state and power measurements
 * every second.
 *
 * See [its product page](https://oort.in/shop/products/oort-smartsocket/)
 * for more information.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 * @display-name Oort Smart Socket
 */

var ble = require('ble');

var OORT_SERVICE_INFO_UUID = '180a';
var OORT_SERVICE_SENSOR_UUID = '0000fee0494c4f474943544543480000';

var OORT_CHAR_SYSTEMID_UUID = '2a23';

var OORT_CHAR_CLOCK_UUID = '0000fee3494c4f474943544543480000';
var OORT_CHAR_SENSOR_UUID = '0000fee1494c4f474943544543480000';
var OORT_CHAR_CONTROL_UUID = '0000fee2494c4f474943544543480000';

var ble_hw = null;
var oort_peripheral = null;
var oort_sensor_characteristic = null;
var oort_clock_characteristic = null;

// Save the Last Known values for output ports
var LK_power   = null;
var LK_voltage = null;
var LK_current = null;
var LK_watts   = null;
var LK_pf      = null;
var LK_freq    = null;

function setup () {
	provideInterface('/onoff');
	provideInterface('/sensor/power');

	createPort('Voltage', ['read', 'eventPeriodic']);
	createPort('Current', ['read', 'eventPeriodic']);
	createPort('PowerFactor', ['read', 'eventPeriodic']);
	createPort('Frequency', ['read', 'eventPeriodic']);
}

function* init () {

	// Connect functions
	addInputHandler('/onoff.Power', inPower);
	addOutputHandler('/onoff.Power', outPower);
	addOutputHandler('Voltage', outVoltage);
	addOutputHandler('Current', outCurrent);
	addOutputHandler('/sensor/power.Power', outWatts);
	addOutputHandler('PowerFactor', outPowerFactor);
	addOutputHandler('Frequency', outFrequency);


	// Get a handle to the hardware
	ble_hw = yield* ble.Central();

	// Using BLE may fail
	if (ble_hw === null) {
		console.error('Unable to get access to a BLE device.');
		return;
	}

	// Start the scan for any devices that advertise the OORT sensor
	// service.
	ble_hw.stayConnected(OORT_SERVICE_SENSOR_UUID, null, null, function* (peripheral) {

		console.info('OORT: connected');

		// if (connect_err) {
		// 	console.error('Error while connecting: ' + connect_err);
		// 	return;
		// }

		// Get the sensor service for the device
		var services = yield* ble_hw.discoverServices(
			peripheral, [OORT_SERVICE_INFO_UUID, OORT_SERVICE_SENSOR_UUID]);

		var index_info = -1;
		var index_sensor = -1;
		for (var i=0; i<services.length; i++) {
			if (services[i].uuid === OORT_SERVICE_INFO_UUID) {
				index_info = i;
			} else if (services[i].uuid === OORT_SERVICE_SENSOR_UUID) {
				index_sensor = i;
			}
		}

		if (index_info === -1) {
			console.error('Could not find a device info service. Can\'t set date.');
			throw 'Could not find a device info service. Can\'t set date.';
		}

		var characteristics = yield* ble_hw.discoverCharacteristics(
			services[index_info], [OORT_CHAR_SYSTEMID_UUID]);

		if (characteristics.length === 0) {
			console.error('Could not get the System ID characteristic.');
			throw 'Could not get the System ID characteristic.';
		}

		var system_id = yield* ble_hw.readCharacteristic(characteristics[0]);

		if (index_sensor === -1) {
			console.error('Could not find sensor service for OORT.');
			throw 'Could not find sensor service for OORT.';
		}

		// Get the characteristics of the sensor service
		var characteristics = yield* ble_hw.discoverCharacteristics(services[index_sensor], [OORT_CHAR_CLOCK_UUID, OORT_CHAR_SENSOR_UUID]);

		for (var i=0; i<characteristics.length; i++) {
			if (characteristics[i].uuid == OORT_CHAR_CLOCK_UUID) {
				oort_clock_characteristic = characteristics[i];
			} else if (characteristics[i].uuid == OORT_CHAR_SENSOR_UUID) {
				oort_sensor_characteristic = characteristics[i];
			}
		}

		// Upon connection, the clock has to be set in order
		// for the OORT to not call disconnect on the connection
		var now = new Date();
		var tosend = [0x03];

		tosend.push(now.getFullYear() & 0xFF);
		tosend.push((now.getFullYear() >> 8) & 0xFF);
		tosend.push(now.getMonth() + 1);
		tosend.push(now.getDate());
		tosend.push(now.getHours());
		tosend.push(now.getMinutes());
		tosend.push(now.getSeconds());

		// Calculate this weird unique thing we have to send
		// in order for the device to accept our date.
		var cksum =
			('i'.charCodeAt(0) ^ system_id[0]) +
			('L'.charCodeAt(0) ^ system_id[1]) +
			('o'.charCodeAt(0) ^ system_id[2]) +
			('g'.charCodeAt(0) ^ system_id[5]) +
			('i'.charCodeAt(0) ^ system_id[6]) +
			('c'.charCodeAt(0) ^ system_id[7]);
		tosend.push(cksum & 0xFF);
		tosend.push((cksum >> 8) & 0xFF);

		// var data = new Buffer([0x03, 0xdf, 0x07, 0x05, 0x1c, 0x16, 0x10, 0x2f, 0x8c, 0x03]);
		// Set the clock on the device
		yield* ble_hw.writeCharacteristic(oort_clock_characteristic, tosend);
		console.info('Successfully set the OORT clock.');

		// Now setup observe because we need that for all data communication
		// Setup the actual notify() callback
		ble_hw.notifyCharacteristic(oort_sensor_characteristic, function (data) {
			LK_power   = data[0] == 0x1;
			LK_voltage = convert_oort_to_float(data.slice(1,4));
			LK_current = convert_oort_to_float(data.slice(4,7));
			LK_watts   = convert_oort_to_float(data.slice(7,10));
			LK_pf      = convert_oort_to_float(data.slice(10,13));
			LK_freq    = convert_oort_to_float(data.slice(13,16));

			send('/onoff.Power', LK_power);
			send('Voltage', LK_voltage);
			send('Current', LK_current);
			send('/sensor/power.Power', LK_watts);
			send('PowerFactor', LK_pf);
			send('Frequency', LK_freq);
		});
	}, function () {
		oort_sensor_characteristic = null;
	}, function (err) {
		console.error(err);
	});
}


// They use a format which I'm either unfamiliar with, or is strange:
//   [0x01, 0x09, 0x99] -> 0.999
function convert_oort_to_float (bytes) {
	function insert_into_string (stri, idx, insert) {
	    return stri.slice(0, idx) + insert + stri.slice(idx);
	}

	function pad (s, width) {
		while (s.length < width) {
			s = '0' + s;
		}
		return s;
	}

	var decimal_offset = bytes[0];
	var val_str = pad(bytes[1].toString(16), 2) + pad(bytes[2].toString(16), 2);

	// Make sure we have four characters
	val_str = insert_into_string(val_str, decimal_offset, '.');
	return parseFloat(val_str);
}

inPower = function* (state) {
	if (oort_sensor_characteristic == null) {
		throw 'No connected OORT. Cannot write.';
	}
	var val = (state) ? 0x1 : 0x0;
	yield* ble_hw.writeCharacteristic(oort_clock_characteristic, [0x4, val]);
}

function any_output (val) {
	if (val == null) {
		throw 'No connected OORT. Cannot read.';
	}

	return val;
}

outPower       = function () { return send('/onoff.Power', any_output(LK_power)); };
outVoltage     = function () { return send('Voltage', any_output(LK_voltage)); };
outCurrent     = function () { return send('Current', any_output(LK_current)); };
outWatts       = function () { return send('/sensor/power.Power', any_output(LK_watts)); };
outPowerFactor = function () { return send('PowerFactor', any_output(LK_pf)); };
outFrequency   = function () { return send('Frequency', any_output(LK_freq)); };

wrapup = function* () {
	if (ble_hw != null && oort_peripheral != null) {
		yield* ble_hw.disconnect(oort_peripheral);
	}
}
