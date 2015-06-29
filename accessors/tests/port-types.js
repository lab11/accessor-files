/**
 * Port Type Test Accessor
 * ======================
 *
 * Verify that the accessor runtime converts port types correctly.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

function setup () {
  createPort('str', ['read'], {
    type: 'string'
  });
  createPort('int', ['read'], {
    type: 'integer'
  });
  createPort('num', ['read'], {
    type: 'numeric'
  });
  createPort('col', ['read'], {
    type: 'color'
  });
  createPort('bool', ['read'], {
    type: 'bool'
  });
}


function* init () {
  addOutputHandler('str', fn_str);
  addOutputHandler('int', fn_int);
  addOutputHandler('num', fn_num);
  addOutputHandler('col', fn_col);
  addOutputHandler('bool', fn_bool);
}

var fn_str = function () {
  send('str', 5);
}

var fn_int = function () {
  send('int', '5');
}

var fn_num = function () {
  send('num', '5.1');
}

// Send an invalid color
var fn_col = function () {
  send('col', '55xfds');
}

var fn_bool = function () {
  send('bool', 1);
}
