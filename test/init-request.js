'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

describe('init-request', function () {

  it('should initialise a request', function () {
    var genInitFn = require('../lib/init-request');
    var url = 'http://localhost:8002';
    var req = {
      __fhOriginalinit: sinon.spy()
    };
    var options = {
      uri: '/users/12345'
    };

    var initFn = genInitFn(req, options);

    // This should initialise the "req" instance by updating it's url
    initFn(url);

    expect(req.uri).to.equal('http://localhost:8002/users/12345');
    expect(req.__fhOriginalinit.calledOnce).to.be.true;
  });

});
