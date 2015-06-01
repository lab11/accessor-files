// name: Oort Smart Socket
// email: bradjc@umich.edu
// author: Brad Campbell
//
// Oort Smart Socket
// =================
//
// BLE power meter and load switch.
//

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

function* init () {
	// provide_interface('/onoff');
	create_port('Power');
	create_port('Voltage');
	create_port('Current');
	create_port('Watts');
	create_port('PowerFactor');
	create_port('Frequency');

	// Get a handle to the hardware
	ble_hw = yield* rt.ble.Client();

	// Using BLE may fail
	if (ble_hw === null) {
		rt.log.error('Unable to get access to a BLE device.');
		return;
	}

	// Start the scan for any devices that advertise the OORT sensor
	// service.
	ble_hw.scan([OORT_SERVICE_SENSOR_UUID], function* (peripheral) {
	// ble_hw.scan([], function* (peripheral) {
		rt.log.info('OORT: found periph');

		// Save the peripheral we find
		if (oort_peripheral == null) {
			rt.log.debug('null peripheral so far')
			ble_hw.scan_stop();
			oort_peripheral = peripheral;

			// Try to connect to the device if it is disconnected
			if (peripheral.state == 'disconnected') {
				// TODO: handle when the device disconnects
				//var connect_err = yield* ble_hw.connect(peripheral /*, on_disconnect() );
				var connect_err = yield* ble_hw.connect(peripheral, function () {
					rt.log.info('OORT disconnected');
				});
				rt.log.info('OORT: connected');

				if (connect_err) {
					rt.log.error('Error while connecting: ' + connect_err);
					return;
				}

				// Get the sensor service for the device
				var services = yield* ble_hw.discover_services(
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
					rt.log.error('Could not find a device info service. Can\'t set date.');
					throw 'Could not find a device info service. Can\'t set date.';
				}

				var characteristics = yield* ble_hw.discover_characteristics(
					services[index_info], [OORT_CHAR_SYSTEMID_UUID]);

				if (characteristics.length === 0) {
					rt.log.error('Could not get the System ID characteristic.');
					throw 'Could not get the System ID characteristic.';
				}

				var system_id = yield* ble_hw.read_characteristic(characteristics[0]);

				if (index_sensor === -1) {
					rt.log.error('Could not find sensor service for OORT.');
					throw 'Could not find sensor service for OORT.';
				}

				// Get the characteristics of the sensor service
				var characteristics = yield* ble_hw.discover_characteristics(services[index_sensor], [OORT_CHAR_CLOCK_UUID, OORT_CHAR_SENSOR_UUID]);

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
				var data = new Buffer(tosend);
				// Set the clock on the device
				yield* ble_hw.write_characteristic(oort_clock_characteristic, data);
				rt.log.debug('Successfully set the OORT clock.');

				// Now setup observe because we need that for all data communication
				yield* setup_observe();
			}
		}
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

// We only have 1 observe stream from the device, so we break it apart
// and send to all ports.
function* setup_observe () {
	if (oort_sensor_characteristic == null) {
		rt.log.error('No connected OORT. Cannot setup observe.');
		throw 'No connected OORT. Cannot setup observe.';
	}

	// Setup the actual notify() callback
	ble_hw.notify_characteristic(oort_sensor_characteristic, function (data) {
		LK_power   = data[0] == 0x1;
		LK_voltage = convert_oort_to_float(data.slice(1,4));
		LK_current = convert_oort_to_float(data.slice(4,7));
		LK_watts   = convert_oort_to_float(data.slice(7,10));
		LK_pf      = convert_oort_to_float(data.slice(10,13));
		LK_freq    = convert_oort_to_float(data.slice(13,16));

		send('Power', LK_power);
		send('Voltage', LK_voltage);
		send('Current', LK_current);
		send('Watts', LK_watts);
		send('PowerFactor', LK_pf);
		send('Frequency', LK_freq);
	});
}

//onoff.Power.input = function* (state) {
Power.input = function* (state) {
	if (oort_sensor_characteristic == null) {
		rt.log.error('No connected OORT. Cannot write.');
		throw 'No connected OORT. Cannot write.';
	}
	var val = (state) ? 0x1 : 0x0;
	yield* ble_hw.write_characteristic(oort_clock_characteristic, new Buffer([0x4, 0x1]));
}

function any_output (val) {
	if (val == null) {
		rt.log.error('No connected OORT. Cannot read.');
		throw 'No connected OORT. Cannot read.';
	}

	return val;
}

Power.output       = function () { return any_output(LK_power); };
Voltage.output     = function () { return any_output(LK_voltage); };
Current.output     = function () { return any_output(LK_current); };
Watts.output       = function () { return any_output(LK_watts); };
PowerFactor.output = function () { return any_output(LK_pf); };
Frequency.output   = function () { return any_output(LK_freq); };

// We support all of these, but don't need the function calls to do anything
Power.observe       = function () { };
Voltage.observe     = function () { };
Current.observe     = function () { };
Watts.observe       = function () { };
PowerFactor.observe = function () { };
Frequency.observe   = function () { };

wrapup = function* () {
	if (ble_hw != null && oort_peripheral != null) {
		yield* ble_hw.disconnect(oort_peripheral);
	}
}
