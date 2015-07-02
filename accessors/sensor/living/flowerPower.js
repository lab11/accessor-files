/**
 * Parrot Flower Power
 * ===================
 *
 * Plant sensor.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 * @display-name Flower Power
 */

var ble = require('ble');

var FP_SERVICE_SENSOR_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

var FP_CHAR_LIGHT_UUID          = '39e1fa0184a811e2afba0002a5d5c51b';
var FP_CHAR_SOIL_EC_UUID        = '39e1fa0284a811e2afba0002a5d5c51b';
var FP_CHAR_SOIL_TEMP_UUID      = '39e1fa0384a811e2afba0002a5d5c51b';
var FP_CHAR_AIR_TEMP_UUID       = '39e1fa0484a811e2afba0002a5d5c51b';
var FP_CHAR_SOIL_VWC_UUID       = '39e1fa0584a811e2afba0002a5d5c51b';
var FP_CHAR_MEASURE_PERIOD_UUID = '39e1fa0684a811e2afba0002a5d5c51b';
var FP_CHAR_LED_UUID            = '39e1fa0784a811e2afba0002a5d5c51b';

var ble_hw = null;
var fp_light_characteristic = null;
var fp_soil_ec_characteristic = null;
var fp_soil_temp_characteristic = null;
var fp_air_temp_characteristic = null;
var fp_soil_vwc_characteristic = null;
var fp_measure_period_characteristic = null;
var fp_led_characteristic = null;

// Save the Last Known values for output ports
var LK_light     = null;
var LK_soil_ec   = null;
var LK_soil_temp = null;
var LK_air_temp  = null;
var LK_soil_vwc  = null;

function setup () {
	createPort('Light', ['read', 'eventPeriodic']);
	createPort('SoilEC', ['read', 'eventPeriodic']);
	createPort('SoilTemp', ['read', 'eventPeriodic']);
	createPort('AirTemp', ['read', 'eventPeriodic']);
	createPort('SoilVWC', ['read', 'eventPeriodic']);
	createPort('LED', ['read', 'write'], {
		type: 'bool'
	});
}

function* init () {

	// Connect functions
	addOutputHandler('Light', outLight);
	addOutputHandler('SoilEC', outSoilEC);
	addOutputHandler('SoilTemp', outSoilTemp);
	addOutputHandler('AirTemp', outAirTemp);
	addOutputHandler('SoilVWC', outSoilVWC);

	addInputHandler('LED', inLED);
	addOutputHandler('LED', outLED);


	// Get a handle to the hardware
	ble_hw = yield* ble.Central();

	// Using BLE may fail
	if (ble_hw === null) {
		throw 'Unable to get access to a BLE device.';
	}

	// Start the scan for any devices that advertise the OORT sensor
	// service.
	ble_hw.stayConnected(FP_SERVICE_SENSOR_UUID, null, null, function* (peripheral) {

		console.info('FP: connected');

		// Get the sensor service for the device
		var services = yield* ble_hw.discoverServices(
			peripheral, [FP_SERVICE_SENSOR_UUID]);

		console.log('FP: got '+services.length+' services');

		var characteristics = yield* ble_hw.discoverCharacteristics(
			services[0], [FP_CHAR_LIGHT_UUID,
			              FP_CHAR_SOIL_EC_UUID,
			              FP_CHAR_SOIL_TEMP_UUID,
			              FP_CHAR_AIR_TEMP_UUID,
			              FP_CHAR_SOIL_VWC_UUID,
			              FP_CHAR_MEASURE_PERIOD_UUID,
			              FP_CHAR_LED_UUID]);

		console.log('FP: got '+characteristics.length+' characteristics');

		// Get all the characteristics matched up.
		// This is a weird way of doing this, but it lets us use synchronous
		// code.
		for (var i=0; i<characteristics.length; i++) {
			var c = characteristics[i];
			if (c.uuid == FP_CHAR_LIGHT_UUID)          fp_light_characteristic = c;
			if (c.uuid == FP_CHAR_SOIL_EC_UUID)        fp_soil_ec_characteristic = c;
			if (c.uuid == FP_CHAR_SOIL_TEMP_UUID)      fp_soil_temp_characteristic = c;
			if (c.uuid == FP_CHAR_AIR_TEMP_UUID)       fp_air_temp_characteristic = c;
			if (c.uuid == FP_CHAR_SOIL_VWC_UUID)       fp_soil_vwc_characteristic = c;
			if (c.uuid == FP_CHAR_MEASURE_PERIOD_UUID) fp_measure_period_characteristic = c;
			if (c.uuid == FP_CHAR_LED_UUID)            fp_led_characteristic = c;
		}

		function toUint16 (data) {
			return data[0] + (data[1] << 8);
		}

		if (fp_light_characteristic != null) {
			ble_hw.notifyCharacteristic(fp_light_characteristic, function (data) {
				LK_light = toUint16(data);
				send('Light', LK_light);
			});
		}

		if (fp_soil_ec_characteristic != null) {
			ble_hw.notifyCharacteristic(fp_soil_ec_characteristic, function (data) {
				LK_soil_ec = (toUint16(data) * 3.3) / 2047;
				send('SoilEC', LK_soil_ec);
			});
		}

		if (fp_soil_temp_characteristic != null) {
			ble_hw.notifyCharacteristic(fp_soil_temp_characteristic, function (data) {
				LK_soil_temp = (toUint16(data) * 3.3) / 2047;
				send('SoilTemp', LK_soil_temp);
			});
		}

		if (fp_air_temp_characteristic != null) {
			ble_hw.notifyCharacteristic(fp_air_temp_characteristic, function (data) {
				LK_air_temp = (toUint16(data) * 3.3) / 2047;
				send('AirTemp', LK_air_temp);
			});
		}

		if (fp_soil_vwc_characteristic != null) {
			ble_hw.notifyCharacteristic(fp_soil_vwc_characteristic, function (data) {
				LK_soil_vwc = (toUint16(data) * 3.3) / 2047;
				send('SoilVWC', LK_soil_vwc);
			});
		}

		// Need to set the sample rate
		if (fp_measure_period_characteristic != null) {
			yield* ble_hw.writeCharacteristic(fp_measure_period_characteristic, [0x1]);
		} else {
			throw 'FP: Did not receive measurement period characteristic, cannot continue.';
		}

	}, function () {
		console.log('Flower Power Disconnected');
		fp_light_characteristic = null;
		fp_measure_period_characteristic = null;
	}, function (err) {
		console.error(err);
	});
}

var inLED = function* (state) {
	if (fp_led_characteristic == null) {
		throw 'No FlowerPower connected, cannot set LED.';
	}
	var out = 0x0;
	if (state) {
		out = 0x1;
	}
	yield* ble_hw.writeCharacteristic(fp_led_characteristic, [out]);
}

var outLED = function* () {
	if (fp_led_characteristic == null) {
		throw 'No FlowerPower connected, cannot read LED.';
	}
	var val = yield* ble_hw.readCharacteristic(fp_led_characteristic);
	console.log(val)
	send('LED', (val==1)?true:false);
}

function any_output (val) {
	if (val == null) {
		throw 'No connected Flower Power. Cannot read.';
	}

	return val;
}


var outLight    = function () { return send('Light', any_output(LK_light)); };
var outSoilEC   = function () { return send('SoilEC', any_output(LK_soil_ec)); };
var outSoilTemp = function () { return send('SoilTemp', any_output(LK_soil_temp)); };
var outAirTemp  = function () { return send('AirTemp', any_output(LK_air_temp)); };
var outSoilVWC  = function () { return send('SoilVWC', any_output(LK_soil_vwc)); };



function* wrapup () {
	if (ble_hw != null && fp_peripheral != null) {
		yield* ble_hw.disconnect(fp_peripheral);
	}
}
