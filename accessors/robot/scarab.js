/**
 * Scarab Accessor
 * ======================
 *
 * Send locations to /goal with ROS.
 *
 * @module robot/scarab
 * @author Brad Campbell <bradjc@umich.edu>
 */

var websocket = require('webSocket');

function setup () {
  createPort('X', ['write'], {
    type: 'numeric'
  });
  createPort('Y', ['write'], {
    type: 'numeric'
  });
  createPort('Z', ['write'], {
    type: 'numeric'
  });
  createPort('Go', ['write']);
}

var ws;
var connection_opened = false;

var coord_x = null;
var coord_y = null;
var coord_z = 0;

function* init () {

  addInputHandler('X', x);
  addInputHandler('Y', y);
  addInputHandler('Z', z);

  addInputHandler('Go', go);

  ws = new websocket.Client('ws://' + getParameter('host'));

  ws.on('open', function () {
    connection_opened = true;
    console.log('YEAH')
  });
  ws.on('error', function () {
    console.log('BOOO Eerr')
  });
  ws.on('message', function (data, flags) {
    console.log('got mesggage')
  });

}

x = function* (val) {
  coord_x = parseFloat(val);
}

y = function* (val) {
  coord_y = parseFloat(val);
}

z = function* (val) {
  coord_z = parseFloat(val);
}

go = function* () {
  var msg = {
    header: {
      seq: 0,
      stamp: {
        secs: 0,
        nsecs: 0
      },
      frame_id: "map_hokuyo"
    },
    pose: {
      position: {
        x: coord_x,
        y: coord_y,
        z: coord_z
      },
      orientation: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        w: 1.0
      }
    }
  }
  var data = {
    op: 'publish',
    topic: '/goal',
    msg: msg
  }

  if (connection_opened) {
    ws.send(JSON.stringify(data));
  } else {
    console.log('Connection not opened yet.');
  }
}
