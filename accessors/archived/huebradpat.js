/**
 * Hue Bulbs for Brad and Pat
 * ==========================
 *
 * This is an example of a meta-accessor.
 *
 * @module
 * @display-name Brad-Pat Hue
 * @author Brad Campbell <bradjc@umich.edu>
 */

var BradHue;
var PatHue;

function* init () {

	var url = get_parameter("bridge_url");
	var uname = get_parameter("username");

	// Get pointers to the sub-accessors (dependencies)
	BradHue = load_dependency('/lighting/hue/huesingle', {bridge_url: url, username: uname, bulb_name: 'Brad'});
	PatHue = load_dependency('/lighting/hue/huesingle', {bridge_url: url, username: uname, bulb_name: 'Pat'});

	provide_interface('/lighting/light');
	provide_interface('/lighting/hue');
}

Power.input = function* (on) {
	yield* BradHue.Power(on);
	yield* PatHue.Power(on);
}

Color.input = function* (color) {
	yield* BradHue.Color(color);
	yield* PatHue.Color(color);
}

Brightness.input = function* (bri) {
	yield* BradHue.Brightness(bri);
	yield* PatHue.Brightness(bri);
}
