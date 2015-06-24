/**
 * WeMo Lights
 * ============
 *
 * WeMo lights are wireless controllable LED lights.
 *
 * @module
 * @author Branden Ghena <brghena@umich.edu>
 */

var http = require('httpClient');
var ssdp = require('ssdpClient');
var dns = require('dnsClient');

// XML headers and footers for HTTP requests
var postbodyheader = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">',
    '<s:Body>'].join('\n');
var postbodyfooter = ['</s:Body>',
  '</s:Envelope>'
].join('\n');

// device parameters
var ip_addr;
var port = null;
var id;

function setup () {
    provideInterface('/lighting/light');
    provideInterface('/lighting/brightness');
}

function* init () {
    addInputHandler('Power', Powerinput);
    addInputHandler('Brightness', Brightnessinput);

    addOutputHandler('Power', Poweroutput);
    addOutputHandler('Brightness', Brightnessoutput);

    //XXX: This works for testing control, but discovery is necessary for real usefulness
    ip_addr = getParameter('ip_addr');
    port = getParameter('port', null);
    id = getParameter('id');

    if (port === null) {
        yield* find_wemo_link_port();
    }
}

function* find_wemo_link_port () {

    var timeout_token;

    // First we need to resolve the host so we get an IP address that we
    // can work with. SSDP gives us back IP addresses, so if the user passed
    // in a hostname we need the IP address. Note, this will also work
    // with just an IP address.
    var dns_client = new dns.Client();
    var ip = yield* dns_client.lookup(ip_addr);
    console.info('IP address for host is: ' + ip);

    // Now look for the correct device and get its port
    var ssdp_client = new ssdp.Client();
    ssdp_client.on('response', function (headers, statusCode, rinfo) {
        if (port == null) {
            // Haven't found it yet
            if ('LOCATION' in headers) {
                var no_http = headers.LOCATION.substring(7, headers.LOCATION.length);

                var res = no_http.split(':');
                var found_ip = res[0];

                if (found_ip == ip) {
                    port = res[1].substring(0, 5);
                    clearTimeout(timeout_token);
                    console.info('WeMo is currently using port ' + port);
                }
            }
        }
    });

    function search () {
        ssdp_client.search('urn:Belkin:service:bridge:1');
    }

    timeout_token = setInterval(search, 10000);
    search();
}

function* discover_light_by_name (name) {
    // discover any WeMo Links

    // discover any WeMo Lights behind the Links

    // save the ip address, port, and unique ID for this bulb

    // ?handle errors somehow?
}

//XXX: This ends up being similar to discovery. To be implemented...
function* get_light_state () {

}

function* set_light_state (capability_id, capability_value) {
    var url = 'http://' + ip_addr + ':' + port + '/upnp/control/bridge1';
    var headers = {
	    'SOAPACTION': '"urn:Belkin:service:bridge:1#SetDeviceStatus"',
		'Content-Type': 'text/xml; charset="utf-8"',
    }
    var body = [
        postbodyheader,
        '<u:SetDeviceStatus xmlns:u="urn:Belkin:service:bridge:1">',
        '<DeviceStatusList>',
        '&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;&lt;DeviceStatus&gt;&lt;IsGroupAction&gt;NO&lt;/IsGroupAction&gt;&lt;DeviceID available=&quot;YES&quot;&gt;{deviceid}&lt;/DeviceID&gt;&lt;CapabilityID&gt;{capabilityid}&lt;/CapabilityID&gt;&lt;CapabilityValue&gt;{capabilityvalue}&lt;/CapabilityValue&gt;&lt;/DeviceStatus&gt;',
        '</DeviceStatusList>',
        '</u:SetDeviceStatus>',
        postbodyfooter
	].join('\n');
    body = body.replace('{deviceid}', id);
    body = body.replace('{capabilityid}', capability_id);
    body = body.replace('{capabilityvalue}', capability_value);
    var options = {
        url: url,
        method: 'POST',
        headers: headers,
        body: body
    }
    var response = (yield* http.request(options)).body;
}

var Powerinput = function* (state) {
    if (port === null) {
        throw('Have not found the WeMo link.');
    }
    yield* set_light_state('10006', (state)?'1':'0');
}

//XXX: Implement me!
var Poweroutput = function* () {
    if (port === null) {
        throw('Have not found the WeMo link.');
    }
    send('Power', true);
}

var Brightnessinput = function* (brightness) {
    if (port === null) {
        throw('Have not found the WeMo link.');
    }
    yield* set_light_state('10008', brightness.toString()+":0");
}

//XXX: Implement me!
var Brightnessoutput = function* () {
    if (port === null) {
        throw('Have not found the WeMo link.');
    }
    send('Brightness', 0);
}
