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
  createPort('X', ['write', 'eventperiodic'], {
    type: 'numeric'
  });
  createPort('Y', ['write', 'eventperiodic'], {
    type: 'numeric'
  });
  createPort('Z', ['write', 'eventperiodic'], {
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

var subscriptions = [
  '/scarab0/gt_pose',   // where the scarab is
];


function* init () {

  addInputHandler('Position', position);

  ws = new websocket.Client('ws://' + getParameter('host'));

  ws.on('open', function () {
    connection_opened = true;
    console.log('Connected to scarab');

    // Subscribe to things we care about
    for (var i=0; i<subscriptions.length; i++) {
      var data = {
        op: 'subscribe',
        topic: subscriptions[i]
      }
      ws.send(JSON.stringify(data));
    }

  });

  ws.on('error', function () {
    console.log('Err. Host: ws://' + getParameter('host'));
  });

  ws.on('message', function (data, flags) {
    // console.log('Got message ' + data);

    var item = JSON.parse(data);
    if ('topic' in item) {
      if (item.topic == '/scarab0/gt_pose') {
        var x = item.msg.pose.position.x;
        var y = item.msg.pose.position.y;
        var z = item.msg.pose.position.z;
        var ox = item.msg.pose.orientation.x;
        var oy = item.msg.pose.orientation.y;
        var oz = item.msg.pose.orientation.z;

        send('X', x);
        send('Y', y);
        send('Z', z);

      } else {
        console.log('Got unknown message ' + data);
      }
    }

  });

}

// Send a position to the robot
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
