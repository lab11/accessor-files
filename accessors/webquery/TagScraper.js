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

var url = '';
var tag = '';

function setup () {
  createPort('URL');
  createPort('Tag');
  createPort('Scrape');
}

function* init () {

}

URL.input = function* (new_url) {
  url = new_url;
}

Tag.input = function* (new_tag) {
  tag = new_tag;
}

Scrape.output = function* () {
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

  return html.substring(start+open.length, end);
}
