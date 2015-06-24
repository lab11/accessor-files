/**
 * Web Tag Scraper
 * ======================
 *
 * Scrape a webpage for the contents of the first tag.
 *
 * This will retrieve the webpage specified by the URL port
 * and scrape the HTML for the first instance of the tag specified
 * by the tag port. Do not include "<>" in the tag name.
 *
 * @module
 * @author Brad Campbell <bradjc@umich.edu>
 */

var http = require('httpClient');


function setup () {
  createPort('URL', ['write'], {
    value: 'http://google.com'
  });
  createPort('Tag', ['write'], {
    value: 'title'
  });
  createPort('Scrape', ['read']);
}

function* init () {
  addOutputHandler('Scrape', scrape);
}

scrape = function* () {
  var url = get('URL');
  var tag = get('Tag');

  console.info('URL: ' + url);
  if (url == '') {
    return '';
  }

  var html = (yield* http.get(url)).body;
  // console.info('HTML: ' + html);

  var open = '<' + tag + '>';
  var close = '</' + tag + '>';

  var start = html.indexOf(open);
  var end = html.indexOf(close, start+open.length);

  var val = html.substring(start+open.length, end);
  send('Scrape', val);
}
