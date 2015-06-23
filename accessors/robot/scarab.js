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
  createPort('Position', ['write'], {
    type: 'object'
  });
  createPortBundle('Position', ['X', 'Y', 'Z']);
}

var ws;
var connection_opened = false;
var seq = 0;


function* init () {

  addInputHandler('Position', position);

  ws = new websocket.Client('ws://' + getParameter('host'));

  ws.on('open', function () {
    connection_opened = true;
    console.log('Connected to scarab');
  });
  ws.on('error', function () {
    console.log('Err. Host: ws://' + getParameter('host'));
  });
  ws.on('message', function (data, flags) {
    console.log('Got message');
  });

}

position = function* (val) {
  var coord_x = parseFloat(val.x);
  var coord_y = parseFloat(val.y);
  var coord_z = parseFloat(val.z);

  var msg = {
    header: {
      seq: seq++,
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
