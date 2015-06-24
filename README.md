Accessor Files Repository
=========================

This is the global file repository for the [accessors project](https://github.com/lab11/accessors).

In general, we encourage any and all contributions for accessors.
Requests to change or add interfaces will generally require some
discussion as interfaces are global in impact and live forever.

For more information on what this project is,
please [visit the project homepage](https://github.com/lab11/accessors).


What Makes an Accessor an Accessor?
-----------------------------------

Accessors are wrappers around devices that channel all interactions with
devices through ports. The accessor starts by defining what the ports should
be, what the data types of those ports should be, and if they are inputs
to the device, outputs, or both. Then the accessor is simply responsible
for handling input data and sending output data.

The key to accessors is they are flexible enough to support a very wide
range of devices (or other services) while still providing a reasonably
standard interface that makes using them intuitive. Accessors are designed
to be used to create applications, both in accessor-specific environments
and embedded into other and existing projects.



How to Write an Accessor
------------------------

The first step to creating an accessor is to define what ports it should
have. What are the common interaction patterns with the device? What is
written to the device, and what is read from it? Does the device output
data on its own? These data flows should be captured with ports.

The ports of the accessor are defined in the `setup()` function. New ports
can be created with the `createPort()` function. However, it may be more
useful to first start with a defined _interface_. Interfaces are groupings
of common ports that similar devices may all want to implement. This allows
accessors and devices to be conveniently grouped based on which interfaces
they provide. Interfaces are found in the `interfaces` folder.

```javascript
function setup () {
	// This device can be turned on and off, so we use the /onoff interface.
	// Now this can be grouped with all devices that can be turned on and off.
	provideInterface('/onoff');

	// Our device also has a neat feature where it can beep when turned off.
	// We must specify how the user can interact with this port. In this case,
	// we can read the status of the setting and write it to change it.
	createPort('BeepOnOff', ['read', 'write']);
}
```

When an accessor is loaded, the first thing it must do is initialize.
Each accessor typically provides an `init()` function that sets it up.
Two main things happen in `init`: 1) Functions are mapped to handle data
that comes in from ports, and 2) A connection to the device is established
(if necessary).

```javascript
function* init () {
	// When data is written to the "Power" port, call the power_input
	// function.
	addInputHandler('/onoff.Power', power_input);

	// We also want to handle when users read from ports.
	addOutputHandler('BeepOnOff', beep_output);
}

// This function will be called when the device is turned on and off.
function power_input (state) {
	// `state` is the data that was passed to the port
}

// This function will be called when the user wants to know if the beep
// is enabled or not.
function beep_output () {
}
```

The main operation of the accessor after it is initialized is to _get_
data from input ports and to _send_ data to output ports. The accessor
can call `get(<port_name>)` to get the most recent data that was written
to an input port, and `send(<port_name>, data)` to output data.

```javascript
function beep_out () {
	var beep_status = yield* http.get('192.168.7.2/beep');
	send('BeepOnOff', beep_status.body == 'true');
}
```

Accessors can also setup ports that spontaneously output data.

```javascript
var coap = require('coapClient');

function setup () {
	// Setup a motion port that will output `true` any time there is
	// motion in front of our hypothetical PIR sensor.
	// We cannot set or query the sensor, but it will generate events
	// anytime there is motion.
	createPort('Motion', ['event']);
}

function* init () {
	// Setup a CoAP observe call that will tell the sensor to notify
	// us whenever motion occurs.
	coap.observe('[aaaa::0123:abcd]/motion', function (val) {
		// Whenever the observe sends us data, this function will get called.
		// From here, we send to the output port so anything listening
		// will be notified that motion occurred.
		send('Motion', true);
	});
}
```

To see more of what accessors can do, browse the existing accessors. Accessors
support many communication and discovery protocols, including HTTP, CoAP, web
sockets, AMQP, SSDP, MDNS, and others.


