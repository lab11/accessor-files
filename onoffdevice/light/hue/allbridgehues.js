var bulbids = [];

function* on_each (body) {
	for (var bulbid in bulbids) {
		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + bulbid + '/state';
		yield* http.request(url, 'PUT', null, JSON.stringify(body), 3000);
	}
}

function* init () {
	var url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights';
	var data = JSON.parse(yield* http.readURL(url));
	var on = false;

	for (var key in data) {
		bulbids.push(key);

		url = get_parameter('bridge_url') + '/api/' + get_parameter('username') + '/lights/' + key;
		var bulb_state = JSON.parse(yield* http.readURL(url));
		if (bulb_state.state.on) {
			on = true;
		}
	}
	set('Power', on);

	set('Bridge', get_parameter('bridge_url'));
}

function* Power (on) {
	console.log('power');
	yield* on_each({'on': on});
}

function* Color (hex_color) {
	hsv = color.hex_to_hsv(hex_color);
	params = {'hue': Math.round(hsv.h*182.04),
	          'sat': Math.round(hsv.s*255),
	          'bri': Math.round(hsv.v*255)}
	yield* on_each(params);
}

function* Brightness (brightness) {
	yield* on_each({'bri': parseInt(brightness)});
}

function* SetAll () {
	var power = get('Power');
	var brightness = get('Brightness');
	var color = get('Color');
	var output = {};

	if (color.length) output.hue = parseInt(color);
	if (brightness.length) output.bri = parseInt(brightness);
	output.on = power;

	yield* on_each(output);
}

function fire () {

}
