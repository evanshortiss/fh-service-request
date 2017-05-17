'use strict';

const Promise = require('bluebird');
const util = require('./util');
const urlJoin = require('url-join');
const xtend = require('xtend');
const getInstanceUrl = require('fh-instance-url').getUrl;
const log = require('./log');
const getServiceCallHeaders = require('fh-instance-url').getServiceCallHeaders;
const request = require('request');
const prequest = Promise.promisify(require('request'));

/**
 * Returns a request
 * @param  {Object} opts
 * @return {Object}
 */
module.exports = function getFhRequestInstance (opts) {
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
  } else {
    log('no guid supplied, getting app by name for opts %j', opts);
    opts.guid = util.getGuidForAppName(opts.name);
  }

  /**
   * Get the GUID and request the matching URL from the FeedHenry platform
   * @return {Promise} resolves to a https URL string
   */
  function performUrlLookup () {
    let guid = opts.guid;

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

  const instance = function performMbaasRequest (options) {
    return performUrlLookup()
      .then((url) => {
        log('init request to url %s with options %j', url, options);

        // Construct the full url
        const _options = xtend(options, {
          uri: urlJoin(url, options.uri || options.url)
        });

        // Don't want to provide request with both uri AND url, or pipe
        delete _options.url;
        delete _options.pipe;

        // Ensure we inject the required headers for service/act calls
        _options.headers = xtend(_options.headers, getServiceCallHeaders());

        log(
          'options passed to request module for service call to %s are %j',
          url,
          _options
          );

        if (options.pipe) {
          log('opts.pipe was truthy so we return the raw request object');
          return request(_options);
        } else {
          log('returning a promisified request');
          return prequest(_options);
        }
      });
  };

  // TODO: add other sugar methods that request exposes, e.g .put, .get, etc.
  return instance;
};
