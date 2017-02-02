'use strict';

var expect = require('chai').expect
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , proxyquire = require('proxyquire');

// require('sinon-as-promised')(require('bluebird'));

describe('request', function () {
  var mod
    , getGuidStub
    , getDomainStub
    , initRequestStub
    , guidLookupStub
    , initialiserStub
    , VALID_OPTS
    , TEST_URL;

  beforeEach(function () {
    VALID_OPTS = {
      guid: '48fhsf6mxzlyqi3ffbpkfh38'
    };

    TEST_URL = 'https://test.feedhenry.com';

    guidLookupStub = sinon.stub();
    getGuidStub = sinon.stub();
    initRequestStub = sinon.stub();
    getDomainStub = sinon.stub().returns(TEST_URL);
    initialiserStub = sinon.stub();

    mod = proxyquire('../lib/request', {
      'fh-instance-url': {
        getUrl: guidLookupStub
      },
      './init-request': initRequestStub,
      './util': {
        getGuidForAppName: getGuidStub,
        getDomain: getDomainStub,
      }
    });
  });

  describe('#getFhRequestInstance', function () {
    it('should throw an exception - unable to determine domain', function () {
      getDomainStub.returns(undefined);

      expect(function () {
        mod({
          guid: 'ok',
          name: 'ok'
        });
      }).to.throw('fh-service-request: could not determine');
    });

    it('should throw an exception - no "name" or "guid"', function () {
      expect(function () {
        mod({});
      }).to.throw('opts.guid or opts.name is required');
    });

    it('should throw an exception - "name" cannot be resolved', function () {
      expect(function () {
        mod({});
      }).to.throw('opts.guid or opts.name is required');
    });

    it('should return "request" instance', function () {
      var req = mod(VALID_OPTS);

      expect(req).to.be.a('function');
      expect(req.get).to.be.a('function');
    });

    it('should fail to make request - guid lookup error', function (done) {
      var req = mod(VALID_OPTS);

      guidLookupStub.yields(new Error('ECONREFUSED - guid lookup failed'));

      req({
        uri: '/tasks'
      }, function (err) {
        expect(err).to.exist;
        expect(err.message).to.contain('ECONREFUSED - guid lookup failed');
        done();
      });
    });

    it('should have request fail (event) - guid lookup fail', function (done) {
      var req = mod(VALID_OPTS);

      guidLookupStub.yields(new Error('ECONREFUSED - guid lookup failed'));

      var emitter = req({
        uri: '/tasks'
      });

      emitter.on(
        'error',
        function (err) {
          expect(err).to.exist;
          expect(err.message).to.contain('ECONREFUSED - guid lookup failed');
          done();
        }
      );
    });

    it('should initialise request with expected url', function (done) {
      var callback = sinon.spy();

      initialiserStub.yields(null);
      guidLookupStub.yields(null, TEST_URL);
      initRequestStub.returns(initialiserStub);

      mod(VALID_OPTS)({
        uri: '/tasks'
      }, callback);

      setTimeout(function () {
        expect(guidLookupStub.called).to.be.true;
        expect(initRequestStub.called).to.be.true;
        expect(initialiserStub.calledWith(TEST_URL)).to.be.true;

        done();
      }, 25);
    });

    it('should handle request init error (event)', function (done) {
      initialiserStub.returns(Promise.reject(new Error('oops')));
      guidLookupStub.yields(null, TEST_URL);
      initRequestStub.returns(initialiserStub);

      var req = mod(VALID_OPTS)({
        uri: '/tasks'
      });

      req.on('error', function (err) {
        expect(err).to.exist;
        expect(guidLookupStub.called).to.be.true;
        expect(initRequestStub.called).to.be.true;
        expect(initialiserStub.calledWith(TEST_URL)).to.be.true;

        done();
      });
    });

    it('should handle request init error (callback)', function (done) {
      initialiserStub.returns(Promise.reject(new Error('oops')));
      guidLookupStub.yields(null, TEST_URL);
      initRequestStub.returns(initialiserStub);

      mod(VALID_OPTS)({
        uri: '/tasks'
      }, function (err) {
        expect(err).to.exist;
        expect(guidLookupStub.called).to.be.true;
        expect(initRequestStub.called).to.be.true;
        expect(initialiserStub.calledWith(TEST_URL)).to.be.true;

        done();
      });
    });

    it('should support request.defaults functionality', function (done) {
      var DEFAULTS = {
        json: true,
        timeout: 15000,
      };

      var req = mod(VALID_OPTS).defaults(DEFAULTS);

      initialiserStub.returns(Promise.reject(new Error('oops')));
      guidLookupStub.yields(null, TEST_URL);
      initRequestStub.returns(initialiserStub);

      req({
        uri: '/tasks'
      }, function (err) {
        expect(err).to.exist;

        expect(
          initRequestStub.getCall(0).args[1].timeout
        ).to.equal(DEFAULTS.timeout);

        expect(
          initRequestStub.getCall(0).args[1].json
        ).to.equal(DEFAULTS.json);

        done();
      });
    });
  });

});
