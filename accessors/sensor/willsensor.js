var ip_addr;

function* init () {
	// INTERFACES
	provide_interface('/sensor/temperature', {
		'/sensor/temperature.Temperature': Thermometer
	});
	provide_interface('/sensor/light_intensity', {
		'/sensor/light_intensity.LightIntensity': LightSensor
	})

	ip_addr = get_parameter('ip_addr');
}

Thermometer.observe = function* () {
	rt.coap.observe('coap://['+ip_addr+']/temp', function(d) { send('Thermometer', d)});
}

LightSensor.observe = function* () {
	rt.coap.observe('coap://['+ip_addr+']/light', function(d) { send('LightSensor', d)} );
}