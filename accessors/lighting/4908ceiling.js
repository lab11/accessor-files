/**
 * Light Control for 4908 Ceiling Lights
 * =====================================
 *
 * Use GATD to control the lights on the ceiling in 4908.
 *
 * @module
 * @display-name 4908 Ceiling Lights
 * @author Brad Campbell <bradjc@umich.edu>
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
