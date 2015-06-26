/**
 * Audio Test Accessor
 * ======================
 *
 * Play a sine wave.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var audio = require('audio');

function* init () {
  var freq = parseInt(getParameter('frequency', 440));

  var player = new audio.Player({
    channels: 1
  });

  var n = 0;
  player.on('read', function () {
    var sinusoid = new Array(128);

    for (var i=0; i<128; i++) {
      var sample = 32760 * Math.sin((2 * Math.PI * freq * n++)/44100);
      sinusoid[i] = sample;
    }
    player.play(sinusoid);

  });

}
