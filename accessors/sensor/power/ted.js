/**
 * TED Power Data
 * ==============
 *
 * Retrieve data from a TED power meter through GATD.
 *
 * @module
 * @display-name TED Power Data
 * @author Brad Campbell <bradjc@umich.edu>
 */

var gatd_url;

function* init () {

	provide_interface('/sensor/power');

	var pid = get_parameter('profile_id');
	var gatd = get_parameter('gatd_url');
	var query = rt.encode.btoa(JSON.stringify({'location_str':get_parameter('location')}));
	gatd_url = gatd + '/viewer/recent/'+pid+'?limit=1&query='+query;
}

Power.output = function* () {
	data = JSON.parse(yield* rt.http.readURL(gatd_url));

	if (data.length == 0) {
		rt.log.error('Could not get TED data.');
		return -1;
	} else {
		watts = parseFloat(data[0].watts);
		return watts;
	}
}
