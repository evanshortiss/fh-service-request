'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru();

describe('init-request', function () {

  it('should initialise a request', function () {
    var genInitFn = proxyquire('../lib/init-request', {
      'fh-instance-url': {
        getServiceCallHeaders: sinon.stub().returns({
          'x-request-with': 'with',
          'x-fh-auth-app': 'auth'
        })
      }
    });
    var url = 'http://localhost:8002';
    var req = {
      __fhOriginalinit: sinon.spy()
    };
    var options = {
      uri: '/users/12345',
      headers: {
        'x-test': 'testing'
      }
    };

    var initFn = genInitFn(req, options);

    // This should initialise the "req" instance by updating it's url
    initFn(url);

    expect(req.uri).to.equal('http://localhost:8002/users/12345');

    expect(req.__fhOriginalinit.calledOnce).to.be.true;
    console.log(req.__fhOriginalinit.getCall(0).args[0]);
    expect(req.__fhOriginalinit.calledWith({
      uri: 'http://localhost:8002/users/12345',
      headers: {
        'x-test': 'testing',
        'x-request-with': 'with',
        'x-fh-auth-app': 'auth'
      }
    })).to.be.true;
  });

});
