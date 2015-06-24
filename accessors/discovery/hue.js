/**
 * Hue Discovery
 * ======================
 *
 * Find hue base stations.
 *
 * @module discovery
 * @author Brad Campbell <bradjc@umich.edu>
 */

var ssdp = require('ssdpClient');
var http = require('httpClient');

function setup () {
  createPort('BridgeURL', ['event']);
  createPort('Search', ['write'], {
    type: 'button'
  });
}

function get_url (xml) {
  var open = '<URLBase>';
  var close = '</URLBase>';

  var start = xml.indexOf(open);
  var end = xml.indexOf(close, start+open.length);

  var val = xml.substring(start+open.length, end);
  return val.substring(0, val.length-1);
}

var ssdp_client = null;
var last_known_location = null;

function* init () {

  addInputHandler('Search', search);

  ssdp_client = new ssdp.Client();

  ssdp_client.on('response', function (headers, status_code, info) {
    if ('LOCATION' in headers) {
      // Get the location page and see what is up
      last_known_location = headers.LOCATION;
      // var xml = (yield* http.get(headers.LOCATION)).body;
      // if (xml.toLowerCase().indexOf('philips hue bridge') > -1) {
      //   var path = get_url(xml);
      //   send('BridgeURL', path);
      // }
    }
  });

  yield* search();
}

var search = function* () {
  console.log('searching...');

  // HACK. This should be in the .on('response') handler
  // But isn't because the function* doesn't get called correctly
  if (last_known_location != null) {
    console.info('looking up ' + last_known_location);
    var xml = (yield* http.get(last_known_location)).body;
    if (xml.toLowerCase().indexOf('philips hue bridge') > -1) {
      var path = get_url(xml);
      send('BridgeURL', path);
    }
  }

  ssdp_client.search('urn:schemas-upnp-org:device:basic:1');
}
