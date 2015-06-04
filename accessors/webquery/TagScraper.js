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

var url = '';
var tag = '';

function* init () {
  create_port('URL');
  create_port('Tag');
	create_port('Scrape');
}

URL.input = function* (new_url) {
  url = new_url;
}

Tag.input = function* (new_tag) {
  tag = new_tag;
}

Scrape.output = function* () {
  rt.log.debug('URL: ' + url);
  if (url == '') {
    return '';
  }

  var html = yield* rt.http.get(url);
  rt.log.debug('HTML: ' + html);

  var open = '<' + tag + '>';
  var close = '</' + tag + '>';

  var start = html.indexOf(open);
  var end = html.indexOf(close, start+open.length);

  return html.substring(start+open.length, end);
}
