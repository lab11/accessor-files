// name:   Color Page
// author: Branden Ghena
// email: brghena@umich.edu

/* Color control for a webpage
 * ======================
 *
 * memristor-v1.eecs.umich.edu
 */

var post_url;

function* init () {
    provide_interface('/lighting/light', {
        'onoff/Power': Power
    });

    post_url = get_parameter('post_url');
}

Power.input = function* (state) {
	var post = (state)?{'color': 'ffffff'}:{'color': '000000'};
    //yield* rt.http.request(post_url, "POST", {'Content-Type': 'application/json'}, JSON.stringify((state)?{'color': 'ffffff'}:{'color': '000000'}), 0);
    yield* rt.http.post(post_url, {form:post});
}

Power.output = function* () {
    return '???';
}

