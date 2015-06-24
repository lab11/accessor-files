/**
 * Control WeMo
 * ============
 * WeMo is a WiFi controlled relay device.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');
var ssdp = require('ssdpClient');
var dns = require('dnsClient');

var set_body = '<?xml version="1.0" encoding="utf-8"?>\
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\
 <s:Body>\
  <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\
   <BinaryState>{binstate}</BinaryState>\
  </u:SetBinaryState>\
 </s:Body>\
</s:Envelope>';

var get_body = '<?xml version="1.0" encoding="utf-8"?>\
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\
 <s:Body>\
  <u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\
  </u:GetBinaryState>\
 </s:Body>\
</s:Envelope>';

var host;
var port = null;

function* find_wemo_port () {

	var timeout_token;

	// First we need to resolve the host so we get an IP address that we
	// can work with. SSDP gives us back IP addresses, so if the user passed
	// in a hostname we need the IP address. Note, this will also work
	// with just an IP address.
	var dns_client = new dns.Client();
	var ip = yield* dns_client.lookup(host);
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
		ssdp_client.search('urn:Belkin:service:manufacture:1');
	}

	timeout_token = setInterval(search, 10000);
	search();
}

function* get_power_state () {
	var headers = {
		'SOAPACTION': '"urn:Belkin:service:basicevent:1#GetBinaryState"',
		'Content-Type': 'text/xml; charset="utf-8"',
	}

	var response = (yield* http.request({
		url: 'http://'+host+':'+port+'/upnp/control/basicevent1',
		method: 'POST',
		headers: headers,
		body: get_body
	})).body;

	var start = response.indexOf('<BinaryState>');
	var power_state = response.substr(start+13, 1);

	// Put this back when the rt. library supports it
	// var power_state = getXMLValue(response, 'BinaryState');

	// set('Power', (parseInt(power_state) == 1));
	return (parseInt(power_state) == 1);
}

function* set_power_state (state) {
	var headers = {
		'SOAPACTION': '"urn:Belkin:service:basicevent:1#SetBinaryState"',
		'Content-Type': 'text/xml; charset="utf-8"',
	}

	var control = set_body.replace('{binstate}', (state) ? '1' : '0');

	yield* http.request({
		url: 'http://'+host+':'+port+'/upnp/control/basicevent1',
		method: 'POST',
		headers: headers,
		body: control
	});
}

function setup () {
	provideInterface('/onoff');
	createPort('Power', ['write', 'read']);
}

function* init () {
	addInputHandler('Power', Power_input);
	addOutputHandler('Power', Power_output);

	host = getParameter('wemo_host');
	port = getParameter('wemo_port', null);

	if (port === null) {
		yield* find_wemo_port();
	}
}

var Power_input = function* (state) {
	if (port == null) {
		throw 'WeMo not found. Can not control the relay.';
	}
	yield* set_power_state(state);
}

var Power_output = function* () {
	if (port == null) {
		throw 'WeMo not found. Can not read the relay.';
	}
	var p = yield* get_power_state();
	send('Power', p);
}
