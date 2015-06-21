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
var port;
var id;

function setup () {
    // INTERFACES
    provideInterface('/lighting/light');
    provideInterface('/lighting/brightness');

    //XXX: This works for testing control, but discovery is necessary for real usefulness
    ip_addr = getParameter('ip_addr');
    port = getParameter('port');
    id = getParameter('id');
}

function* init () {
    addInputHandler('/lighting/light.Power', Powerinput);
    addInputHandler('/lighting/brightness.Brightness', Brightnessinput);

    addOutputHandler('/lighting/light.Power', Poweroutput);
    addOutputHandler('/lighting/brightness.Brightness', Brightnessoutput);
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
    var response = (yield* http.request(url, 'POST', headers, body, 0)).body;
}

// lighting.light.Power.input = function* (state) {
var Powerinput = function* (state) {
    yield* set_light_state('10006', (state)?'1':'0');
}

//XXX: Implement me!
// lighting.light.Power.output = function* () {
var Poweroutput = function* () {
	//var val = yield* rt.coap.get('coap://['+ip_addr+']/onoff/Power');
	//return val == 'true';
    send('/lighting/light.Power', true);
}

// lighting.brightness.Brightness.input = function* (brightness) {
var Brightnessinput = function* (brightness) {
    yield* set_light_state('10008', brightness.toString()+":0");
}

//XXX: Implement me!
// lighting.brightness.Brightness.output = function* () {
var Brightnessoutput = function* () {
	//var bri = parseInt(yield* rt.coap.get('coap://['+ip_addr+']/sdl/luxapose/DutyCycle'));
	//return bri * 2.55;
    send('/lighting/brightness.Brightness', 0);
}
