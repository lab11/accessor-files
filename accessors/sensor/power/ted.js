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

var http = require('httpClient');

var gatd_url;

function setup () {
	provideInterface('/sensor/power');
}

function* init () {
	addOutputHandler('/sensor/power.Power', Power_output);

	var pid = getParameter('profile_id');
	var gatd = getParameter('gatd_url');
	var query = rt.encode.btoa(JSON.stringify({'location_str':getParameter('location')}));
	gatd_url = gatd + '/viewer/recent/'+pid+'?limit=1&query='+query;
}

var Power_output = function* () {
	data = JSON.parse((yield* http.readURL(gatd_url)).body);

	if (data.length == 0) {
		rt.log.error('Could not get TED data.');
		return -1;
	} else {
		watts = parseFloat(data[0].watts);
		send('/sensor/power.Power', watts);
	}
}
