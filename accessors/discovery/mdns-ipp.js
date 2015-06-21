/**
 * mDNS Service Discovery for Printers
 * ======================
 *
 * Use mDNS-SD to find IPP printers.
 *
 * @module discovery
 * @author Brad Campbell <bradjc@umich.edu>
 */

var mdns = require('mdnsClient');

function setup () {
  createPort('PrinterURL', ['event']);
}

function* init () {

  var m = new mdns.Client();
  var browser = m.createBrowser(m.tcp('ipp'));

  browser.on('serviceUp', function (service) {
    var url = 'http://';
    url += service.addresses[0];
    url += ':' + service.port;
    url += '/' + service.txtRecord.rp;

    send('PrinterURL', url);
  });

  browser.on('error', function (err) {
    console.log(err);
  });

  browser.start();
}
