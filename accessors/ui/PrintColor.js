/**
 * Command Line Print in Color
 * ===========================
 *
 * Strictly input, simply prints whatever is received on its port.
 *
 * @module ui/PrintColor
 * @author Brad Campbell <bradjc@umich.edu>
 */

var xt256_color = 32;

function setup () {
  createPort('Color', ['write'], {
    type: 'color'
  });
  createPort('Text', ['write']);
}

function* init () {
  addInputHandler('Color', color_input);
  addInputHandler('Text', text_input);
}

// Find the xterm-256 value that is closest to the color channel
function nearest_offset (channel_val) {
  var values = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];
  var best_diff = 255;
  var selection = 0;

  for (var i=0; i<values.length; i++) {
    var diff = Math.abs(values[i] - channel_val);
    if (diff < best_diff) {
      best_diff = diff;
      selection = i;
    }
  }
  return selection;
}

var color_input = function* (color) {
  var r = parseInt(color.substring(0, 2), 16);
  var g = parseInt(color.substring(2, 4), 16);
  var b = parseInt(color.substring(4, 6), 16);

  var ri = nearest_offset(r);
  var gi = nearest_offset(g);
  var bi = nearest_offset(b);

  xt256_color = 16 + (36 * ri) + (6 * gi) + bi;
}

var text_input = function* (text) {
  console.log('\033[38;5;'+xt256_color+'m' + text + '\033[0m');
}
