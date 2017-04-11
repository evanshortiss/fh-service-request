'use strict';

var xtend = require('xtend')
  , urlJoin = require('url-join')
  , getServiceCallHeaders = require('fh-instance-url').getServiceCallHeaders;

module.exports = function initialiseRequest (req, options) {

  return function _doInit (url) {
    // Construct the full url
    var _options = xtend(options, {
      uri: urlJoin(url, options.uri)
    });

    // Ensure we inject the required headers for service/act calls
    _options.headers = xtend(_options.headers, getServiceCallHeaders());

    // Delete our custom options, just in case...
    delete _options.guid;
    delete _options.name;

    // Need to update the uri Request assigns to "this"
    req.uri = _options.uri;

    // Call the original init function now that we have a full url/uri
    req.__fhOriginalinit(_options);
  };

};
