/**
 * SSDP Discovery
 * ======================
 *
 * Lookup devices using SSDP.
 *
 * @module discovery
 * @author Brad Campbell <bradjc@umich.edu>
 */

var ssdp = require('ssdpClient');

function setup () {
  // Respond with the provided locations of all discovered devices.
  // There will be duplicates.
  createPort('Location', ['event']);
}

function* init () {

  var c = new ssdp.Client();

  c.on('response', function (headers, status_code, info) {
    if ('LOCATION' in headers) {
      send('Location', headers.LOCATION);
    }
  });

  function search () {
    c.search('ssdp:all');
  }

  setInterval(search, 10000);
  search();
}
