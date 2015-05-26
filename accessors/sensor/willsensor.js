// name:   4908 Lights
// author: Will Huang
// email: wwwhuang@umich.edu

/* Light and Temperature Sensor 
 * ======================
 *
 * If this doesn't work, it's brad's fault
 */


function* init () {
	provide_interface('/lighting/light');
}

Power.input = function* (state) {
	var post_url = get_parameter('post_url');
	var location = get_parameter('location_str');
	var data = {};

	data['light_command'] = (state) ? 'on' : 'off';
	data['location_str'] = location;
	yield* rt.http.request(post_url, 'POST', {'Content-Type': 'application/json'}, JSON.stringify(data), 0);
}


var ip_addr;

function* init () {
	// INTERFACES
	provide_interface('/sensor/temperature');
	provide_interface('/sensor/light_intensity');

	ip_addr = get_parameter('ip_addr');
}

Thermometer.observe = function* () {
	rt.coap.observe('coap://['+ip_addr+']/temp', function(d) { send('Thermometer', d)});
}

LightSensor.observe = function* () {
	rt.coap.observe('coap://['+ip_addr+']/light', function(d) { send('LightSensor', d)} );
}