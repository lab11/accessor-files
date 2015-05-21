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
    yield* rt.http.request(post_url, "POST", {'Content-Type': 'application/x-www-form-urlencoded'}, (state)?'color=ffffff':'color=000000', 0);
}

Power.output = function* () {
    return '???';
}

