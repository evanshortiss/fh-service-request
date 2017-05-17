'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// require('sinon-as-promised')(require('bluebird'));

describe('request', function () {
  var mod
    , stubs
    , getDomainStub
    , initRequestStub
    , initialiserStub
    , VALID_OPTS
    , TEST_URL;

  const REQUEST = 'request';
  const INSTANCE_URL = 'fh-instance-url';
  const UTIL = './util';

  beforeEach(function () {
    require('clear-require').all();

    VALID_OPTS = {
      guid: '48fhsf6mxzlyqi3ffbpkfh38'
    };

    TEST_URL = 'https://test.feedhenry.com';

    getDomainStub = sinon.stub().returns(TEST_URL);

    stubs = {
      [REQUEST]: sinon.stub(),
      [INSTANCE_URL]: {
        getUrl: sinon.stub(),
        getServiceCallHeaders: sinon.stub()
      },
      [UTIL]: {
        getGuidForAppName: sinon.stub(),
        getDomain: getDomainStub,
      }
    };

    mod = proxyquire('../lib/request', stubs);
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
    });

    it('should fail to make request - guid lookup error', function () {
      var req = mod(VALID_OPTS);

      stubs[INSTANCE_URL].getUrl.yields(new Error('ECONREFUSED - guid lookup failed'));

      return req({
        uri: '/tasks'
      })
        .then(() => {
          throw new Error('not the error we want');
        })
        .catch((err) => {
          expect(err).to.exist;
          expect(err.message).to.contain('ECONREFUSED - guid lookup failed');
        });
    });

    it('should throw an error if given an invalid opts.name', function () {
      expect(function () {
        mod({
          name: 'not-valid'
        });
      }).to.throw('no entry was found');
    });

    it('should perform request with expected uri', function () {
      const headers = {
        'x-char-string': 'abc'
      };

      stubs[INSTANCE_URL].getUrl.yields(null, TEST_URL);
      stubs[REQUEST].yields(null, {statusCode: 200});
      stubs[INSTANCE_URL].getServiceCallHeaders.returns(headers);

      const req = mod(VALID_OPTS);

      return req({
        uri: '/tasks'
      })
        .then((res) => {
          expect(stubs[INSTANCE_URL].getUrl.calledOnce).to.be.true;
          expect(stubs[REQUEST].getCall(0).args[0]).to.deep.equal({
            uri: `${TEST_URL}/tasks`,
            headers: headers
          });
        });
    });

    it('should perform request with expected url (uri)', function () {
      const headers = {
        'x-char-string': 'abc'
      };

      stubs[INSTANCE_URL].getUrl.yields(null, TEST_URL);
      stubs[REQUEST].yields(null, {statusCode: 200});
      stubs[INSTANCE_URL].getServiceCallHeaders.returns(headers);

      const req = mod(VALID_OPTS);

      return req({
        url: '/tasks'
      })
        .then((res) => {
          expect(stubs[INSTANCE_URL].getUrl.calledOnce).to.be.true;
          expect(stubs[REQUEST].getCall(0).args[0]).to.deep.equal({
            uri: `${TEST_URL}/tasks`,
            headers: headers
          });
        });
    });

    it('should perform request and return the request instance', function () {
      const headers = {
        'x-char-string': 'abc'
      };

      const requestStub = sinon.stub();

      stubs[INSTANCE_URL].getUrl.yields(null, TEST_URL);
      stubs[REQUEST].returns(requestStub);
      stubs[INSTANCE_URL].getServiceCallHeaders.returns(headers);

      const req = mod(VALID_OPTS);

      return req({
        pipe: true,
        uri: '/tasks'
      })
        .then((request) => {
          expect(stubs[INSTANCE_URL].getUrl.calledOnce).to.be.true;
          expect(stubs[REQUEST].getCall(0).args[0]).to.deep.equal({
            uri: `${TEST_URL}/tasks`,
            headers: headers
          });

          expect(requestStub).to.equal(request);
        });
    });
  });

});
