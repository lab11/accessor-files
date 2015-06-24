/**
 * Color control for a webpage
 * ===========================
 *
 * memristor-v1.eecs.umich.edu
 *
 * @module
 * @display-name Color Page
 * @author Branden Ghena <brghena@umich.edu>
 */

var http = require('httpClient');

var post_url;

function setup () {
	provideInterface('/lighting/light');
}

function* init () {
	addInputHandler('Power', Power_input);
	addOutputHandler('Power', Power_output);

    post_url = getParameter('post_url');
}

var Power_input = function* (state) {
	var post = {
		method: 'POST',
		url: post_url,
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: (state)?'color=ffffff':'color=000000'
	}
    yield* http.request_fn(post);
}

var Power_output = function* () {
    return false;
}

