/**
 * Scarab Accessor
 * ======================
 *
 * Accessor for controlling a Scarab robot. Scarabs use ROS, and this accessor
 * interacts with the ROS system using its WebSockets bridge.
 *
 * This accessor publishes to the `/goal` topic to control where the robot
 * should go, and subscribes to the `/scarab0/gt_pose` topic to know
 * where the robot currently is.
 *
 * To move the robot, send a set of destination X,Y,Z coordinates to the
 * `Position` port bundle.
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
  createPortBundle('Position', ['X', 'Y', 'Z']);

  createPort('Battery', ['eventperiodic'], {
    type: 'integer',
    min: 0,
    max: 100
  });
}

var ws;
var connection_opened = false;
var seq = 0;

var cur_x = null;
var cur_y = null;
var cur_z = null;

var preface = '/scarab/scarab';

var subscriptions = [
  '/pose_stamped',   // where the scarab is
  '/diagnostics'
];


function* init () {

  var robot_name = getParameter('ros_namespace');
  preface = '/' + robot_name + '/' + robot_name;

  addInputHandler('Position', position);

  ws = new websocket.Client('ws://' + getParameter('host'));

  ws.on('open', function () {
    connection_opened = true;
    console.log('Connected to scarab');

    // Subscribe to things we care about
    for (var i=0; i<subscriptions.length; i++) {
      var topic = preface + subscriptions[i];
      var data = {
        op: 'subscribe',
        topic: topic
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
      var topic = item.topic.substring(preface.length, item.topic.length);
      if (topic == '/pose_stamped') {
        cur_x = item.msg.pose.position.x;
        cur_y = item.msg.pose.position.y;
        cur_z = item.msg.pose.position.z;
        var ox = item.msg.pose.orientation.x;
        var oy = item.msg.pose.orientation.y;
        var oz = item.msg.pose.orientation.z;

        send('X', cur_x);
        send('Y', cur_y);
        send('Z', cur_z);

      } else if (topic === '/diagnostics') {
        // Make sure it is the battery diagnostic
        if ('status' in item.msg &&
            item.msg.status instanceof Array &&
            item.msg.status.length > 0 &&
            'hardware_id' in item.msg.status[0] &&
            item.msg.status[0].hardware_id.substr(preface.length, 4) == 'BB04') {
          // This is about the battery
          var charge = 0;
          var count = 0;
          for (var i=0; i<item.msg.status.length; i++) {
            var status_list = item.msg.status[i].values;
            for (var j=0; j<status_list.length; j++) {
              var status_item = status_list[j];
              if (status_item.key === 'Relative State of Charge (%)') {
                count += 1;
                charge += parseInt(status_item.value);
              }
            }
          }

          var percent = Math.round(charge/count);
          if (!isNaN(percent)) {
            send('Battery', percent);
          }
        }

      } else {
        console.log('Got unknown message ' + data);
      }
    }

  });

}

// Send a position to the robot
position = function* (val) {
  var coord_x = parseFloat(val.X || cur_x);
  var coord_y = parseFloat(val.Y || cur_y);
  var coord_z = parseFloat(val.Z || cur_z);

  if (isNaN(coord_x)) coord_x = 0;
  if (isNaN(coord_y)) coord_y = 0;
  if (isNaN(coord_z)) coord_z = 0;

  console.info('Moving to: ' + coord_x + ',' + coord_y + ',' + coord_z);

  var msg = {
    header: {
      seq: seq++,
      stamp: {
        secs: 0,
        nsecs: 0
      },
      frame_id: "map_hokuyo"
    },
    goal_id: {
      id: 'accessor' + seq,
      stamp: {
        secs: 0,
        nsecs: 0
      }
    },
    goal: {
      stop: false,
      target_poses: [
        {
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
      ]
    }
  }
  var data = {
    op: 'publish',
    topic: '/scarab/scarab/move/goal',
    msg: msg
  }

  if (connection_opened) {
    ws.send(JSON.stringify(data));
  } else {
    console.log('Connection not opened yet.');
  }
}
