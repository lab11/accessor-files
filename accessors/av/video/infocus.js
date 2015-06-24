/**
 * InFocus Projector Accessor
 * ==========================
 *
 * InFocus makes projectors. This accessor works for the model in our lab (whose
 * actual model number is surprisingly difficult to ascertain) and may well work
 * for other InFocus projectors.
 *
 * @module
 * @display-name InFocus Projector
 * @author Pat Pannuto <ppannuto@umich.edu>
 */

 var http = require('httpClient');

var POWER_STATES = {
  'off' : 0,
  'on' : 1,
  'turning_off' : 2,
  'turning_on' : 3
};

var SOURCES = {
  'VGA' : 1,
  'HDMI 1' : 2,
  'HDMI 2' : 3,
  'S-Video' : 4,
  'Composite' : 5
};

function find_in_xml (xml, tag) {
  var open = '<' + tag + '>';
  var close = '</' + tag + '>';

  var start = xml.indexOf(open);
  var end = xml.indexOf(close, start+open.length);

  var val = xml.substring(start+open.length, end);
  return val;
}

function setup () {
  // provideInterface('/av/videodevice');

  createPort('Power', ['read', 'write']);

  // Select the video source for the projector
  createPort('Input', ['write', 'read'], {
    type: 'select',
    options: ['VGA', 'HDMI 1', 'HDMI 2', 'S-Video', 'Composite']
  });
}

function* init () {
  addInputHandler('Power', Power_input);
  addOutputHandler('Power', Power_output);
  addInputHandler('Input', Input_input);
  addOutputHandler('Input', Input_output);
}

var Power_input = function* (power_setting) {
  var url;

  if (power_setting) {
    url = getParameter('device_url') + '/dpjset.cgi?PJ_PowerMode=1';
  } else {
    url = getParameter('device_url') + '/dpjset.cgi?PJ_PowerMode=0';
  }
  yield* http.get(url);
}

var Power_output = function* () {
  var url = getParameter('device_url') + '/PJState.xml';

  /* Get the XML status from the receiver */
  var xml = (yield* http.get(url)).body;

  var val = find_in_xml(xml, 'pjPowermd');
  if ((val == POWER_STATES['off']) || (val == POWER_STATES['turning_off'])) {
    send('Power', false);
  } else {
    send('Power', true);
  }
}

var Input_input = function* (input_setting_choice) {
  if (SOURCES[input_setting_choice] === undefined) return;

  var url = getParameter('device_url') + '/dpjset.cgi?PJ_SRCINPUT=' + SOURCES[input_setting_choice];
  yield* http.get(url);
}

var Input_output = function* (input_setting_choice) {
  var url = getParameter('device_url') + '/PJState.xml';

  /* Get the XML status from the receiver */
  var xml = (yield* http.get(url)).body;
  var val = parseInt(find_in_xml(xml, 'pjsrc'));
  var out = null;

  for (var source in SOURCES) {
    if (SOURCES.hasOwnProperty(source)) {
      if (SOURCES[source] == val) {
        out = source;
      }
    }
  }

  if (out !== null) {
    send('Input', out);
  } else {
    throw 'Could not determine projector input setting.';
  }
}
