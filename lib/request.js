'use strict';

var Promise = require('bluebird')
  , util = require('./util')
  , VError = require('verror')
  , initRequest = require('./init-request')
  , getInstanceUrl = require('fh-instance-url').getUrl
  , log = require('./log')
  , request = require('request');

/**
 * Returns a request
 * @param  {Object} opts
 * @return {Object}
 */
module.exports = function getFhRequestInstance (opts) {
  // Retain the original request constructor reference
  var RequestCtor = request.Request;

  log('getting fh-service-request instance with opts %j', opts);

  // Must be able to resolve the domain to start
  if (!util.getDomain()) {
    throw new Error(
      'fh-service-request: could not determine your domain. please check ' +
      'the fhconfig.json "domain" property is set, or FH_MILLICORE ' +
      'environment variable is set.'
    );
  }

  // Name of GUID is required to determine the MBaaS url
  if (!opts.guid && !opts.name) {
    throw new Error(
      'fh-service-request: opts.guid or opts.name is ' +
      'required. If using opts.name, ensure package.json has the ' +
      'fh.services.namemap and a matching entry, ' +
      'e.g {"AUTH_SERVICE":"24mbaasGuidChars"}'
    );
  }

  // If name is provided we must be able to resolve it
  if (opts.name && !util.getGuidForAppName(opts.name)) {
    throw new Error(
      'fh-service-request: opts.name "%s" was provided but no entry was ' +
      'found at fh.services.namemap.%s is entry, ' +
      'e.g "services.nameMap": {"AUTH_SERVICE":"24mbaasGuidChars"}',
      opts.name
    );
  }

  if (!RequestCtor.prototype.__fhOriginalinit) {
    log('overriding request module prototype.init due to initial load');
    // Preserve the original init function for use later
    RequestCtor.prototype.__fhOriginalinit = RequestCtor.prototype.init;
  }


  /**
   * Get the GUID and request the matching URL from the FeedHenry platform
   * @return {Promise} resolves to a https URL string
   */
  function performUrlLookup () {
    var guid = opts.guid;

    if (!guid) {
      log('no guid supplied, getting app by name for opts %j', opts);
      // We need to find the guid by name since opts.guid is not supplied
      guid = util.getGuidForAppName(opts.name);
    }

    return Promise.fromCallback(function (callback) {
      getInstanceUrl({
        domain: util.getDomain(),
        guid: guid
      }, function (err, url) {
        if (!err) {
          log('url for opts %j resolved to', opts, url);
        }

        callback(err, url);
      });
    });
  }

  var instance = function performMbaasRequest () {
    // Temporarily override Request.prototype.init so we can dynamically get
    // the service host and update the URI parameter
    RequestCtor.prototype.init = function initFhRequest (options) {
      log(
        'init request with request options %j, for original config %j',
        options,
        opts
      );

      var req = this;

      return Promise.resolve()
        .then(performUrlLookup)
        .then(initRequest(req, options))
        .catch(function (err) {
          err = new VError(
            err,
            'fh-service-request failed to initialise the request'
          );

          if (options.callback) {
            options.callback(err);
          } else {
            req.emit('error', err);
          }
        });
    };

    return request.apply(request, Array.prototype.slice.call(arguments));
  };

  return instance;
};
