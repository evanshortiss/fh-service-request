'use strict';

var expect = require('chai').expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire');


describe('util', function () {
  var mod, env, envStub;

  beforeEach(function () {
    env = sinon.stub();

    envStub = {
      asString: sinon.stub()
    };

    mod = proxyquire('../lib/util', {
      'env-var': env.returns(envStub)
    });
  });

  describe('#getDomain', function () {
    it('should return the domain from fhconfig', function () {
      envStub.asString.onCall(0).returns('true');

      expect(mod.getDomain()).to.equal(require('../fhconfig.json').domain);
    });

    it('should return the domain from env var', function () {
      var domain = 'other-test.feedhenry.com';

      envStub.asString.onCall(0).returns(undefined);
      envStub.asString.onCall(1).returns('dev');
      envStub.asString.onCall(2).returns(domain);
      envStub.asString.onCall(3).returns(domain);

      expect(mod.getDomain()).to.equal(domain);
    });
  });

  describe('#getGuidForAppName', function () {
    it('should return the guid for a given name alias', function () {
      expect(mod.getGuidForAppName('MY_AUTH_SERVICE')).to.equal(
        '48fhsf6mxzlyqi3ffbpkfh38'
      );
    });

    it('should return the guid from a cache', function () {
      expect(mod.getGuidForAppName('MY_AUTH_SERVICE')).to.equal(
        '48fhsf6mxzlyqi3ffbpkfh38'
      );
    });

    it('should return the null for the given name alias', function () {
      expect(mod.getGuidForAppName('INVALID_NAME')).to.equal(null);
    });
  });

  describe('#getConfigForGuid', function () {
    it('should return an Object with config information', function () {
      expect(mod.getConfigForGuid('48fhsf6mxzlyqi3ffbpkfh38')).to.deep.equal({
        devUrl: 'http://127.0.0.1:8001/',
        name: 'MY_AUTH_SERVICE'
      });
    });

    it('should return undefined', function () {
      expect(mod.getConfigForGuid('nope')).to.equal(undefined);
    });
  });

});
