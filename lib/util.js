'use strict';

var path = require('path')
  , get = require('lodash.get')
  , env = require('env-var')
  , log = require('./log');


var pkg = {};

// Attempt to load the user's fhconfig.json
try {
  log('attempting to load fhconfig.json');
  pkg = require(
    path.join(process.cwd(), 'fhconfig.json')
  );
} catch (e) {
  console.warn(
    'fh-service-request did not find and fhconfig.json in your ' +
    'application root directory. The fhconfig.json is required for certain ' +
    'features of this module to work. Checkout the README at ' +
    'github.com/evanshortiss/fh-service-request for more information'
  );
}

/**
 * Determine if the application is deployed on RHMAP, or locally
 * @param  {Object} env process.env Object
 * @return {Boolean}
 */
function isLocal () {
  // This should be suffificient to determine are we running locally or not, but
  // might require more considerations since it is a little crude
  return (
    env('FH_USE_LOCAL_DB').asString() ||
    !env('FH_MILLICORE').asString() ||
    !env('FH_ENV').asString()
  );
}


/**
 * Returns the configuration for a given GUID
 * @param  {String} guid
 * @return {Object}
 */
exports.getConfigForGuid = function (guid) {
  log('getting config for guid %s from fhconfig.json', guid);
  return (pkg.services) ? pkg.services[guid] : null;
};


/**
 * Returns the domain this application is running on.
 *
 * Locally it will use the domain in the fhconfig, else it'll check the
 * environment variables, be sure they match to avoid headaches
 * @return {String}
 */
exports.getDomain = function () {
  return isLocal() ? pkg.domain : env('FH_MILLICORE').asString();
};


/**
 * Retrieve a GUID for a given application name from fhconfig.json
 * @param  {String} name
 * @return {String|null}
 */
exports.getGuidForAppName = (function genGetGuidForAppName () {
  var cache = {};

  return function _getGuidForAppName (name) {

    if (cache[name]) {
      // Avoids looping items on each call
      return cache[name];
    } else {
      for (var guid in pkg.services) {
        if (get(pkg, 'services[' + guid + '].name') === name) {
          cache[name] = guid;
          return guid;
        }
      }

      return null;
    }
  };
})();
