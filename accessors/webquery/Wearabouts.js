/**
 * Wearabouts Accessor
 * ===================
 *
 * Get list of people in the room.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');
var encode = require('encode');

function setup () {
	createPort('People', ['read'], {
		type: 'string',
		description: 'The people in the room'
	});
}

function* init () {
	addOutputHandler('People', people);
}

var people = function* () {
	var pid = getParameter('profile_id');
	var gatd = getParameter('gatd_url');
	var query = encode.btoa(JSON.stringify({'location_str':getParameter('location')}));
	var url = gatd + '/viewer/recent/'+pid+'?limit=1&query='+query;

	console.log(url);

	data = JSON.parse((yield* http.get(url)).body);

	if (data.length == 0) {
		send('People', 'Nobody in the room');
	} else {
		people_list = data[0].person_list;
		people_names = [];
		for (var i=0; i<people_list.length; i++) {
			person = people_list[i];
			for (key in person) {
				people_names.push(person[key]);
			}
		}
		if (people_names.length == 0) {
			send('People', 'Nobody in the room');
		} else {
			send('People', people_names.join(', '));
		}
	}
}
