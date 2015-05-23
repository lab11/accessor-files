// name: All Hues on a Bridge
// author: Brad Campbell
// email: bradjc@umich.edu
//
// Hue Light Bulbs
// ===============
//
// This controls all of the hues behind a bridge.
//

var bulbids = [];

function* on_each (body) {
	for (var bulbid in bulbids) {
		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbid + '/state';
		yield* rt.http.request(url, 'PUT', null, JSON.stringify(body), 3000);
	}
}

function* init () {
	provide_interface('/lighting/light', {
		'/lighting/light.Power': Power,
	});
	provide_interface('/lighting/hue', {
		'/lighting/rgb.Color': Color,
		'/lighting/brightness.Brightness': Brightness
	});

	create_port('Bridge');

	// Populate the list of known bulbs
	var url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights';
	var data = JSON.parse(yield* rt.http.get(url));
	for (var key in data) {
		bulbids.push(key);
	}
}

Power.input = function* (on) {
	yield* on_each({'on': on});
}

Power.output = function* () {
	var on = false;

	for (var bulbid in bulbids) {
		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbid;
		var bulb_state = JSON.parse(yield* rt.http.get(url));
		if (bulb_state.state.on) {
			on = true;
		}
	}

	return on;
}

Color.input = function* (hex_color) {
	hsv = rt.color.hex_to_hsv(hex_color);
	params = {'hue': Math.round(hsv.h*182.04),
	          'sat': Math.round(hsv.s*255),
	          'bri': Math.round(hsv.v*255)}
	yield* on_each(params);
}

Color.output = function* () {
	if (bulbids.length > 0) {
		// There are two cases here.
		// 1. All the lights are the same color. So we ask the first and
		//    return its color.
		// 2. They are not all the same color. Well then who knows what we should
		//    return so we just return the color of the first light again.
		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbids[0];
		var bulb_state = JSON.parse(yield* rt.http.get(url));
		var color = {
			'h': bulb_state.state.hue / 182.04,
			's': bulb_state.state.sat / 255,
			'v': bulb_state.state.bri / 255
		}
		return rt.color.hsv_to_hex(color);
	} else {
		// Need to return something...
		return '000000';
	}
}

Brightness.input = function* (brightness) {
	yield* on_each({'bri': parseInt(brightness)});
}

Brightness.output = function* () {
	if (bulbids.length > 0) {
		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbids[0];
		var bulb_state = JSON.parse(yield* rt.http.get(url));
		return bulb_state.state.bri;
	} else {
		// Need to return something...
		return 0;
	}
}

Bridge.output = function* () {
	return get_parameter('bridge_url');
}
