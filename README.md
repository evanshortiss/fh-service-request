fh-service-request
==================

Like $fh.service, but exposes the full `request` API meaning you can get the
regular `request` goodness that you're used to via MBaaS calls.

Currently `request` sugar methods such as `request.get` etc. are not supported!


## Install

```
npm i fh-service-request --save
```


## Usage

```js
// Use this to make requests to MBaaS with the guid 48fhsf6mxzlyqi3ffbpkfh38
var tasksMbaasRequest = require('fh-service-request')({
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
});

// Make a GET request using the regular "request" module API
tasksMbaasRequest({
  method: 'GET',

  // Normally with the request module we'd pass "url" here, but since we're
  // using fh-service-request the MBaaS URL will be resolved for us and this
  // path will be appended to it
  uri: '/tasks',

  // Tell request to parse responses as JSON - typical request option
  json: true,

  // Query for items owned by "feedhenry" user - also a typical option
  qs: {
    owner: 'feedhenry'
  }
})
  .then((res) -> {
      console.log('tasks for "feedhenry"', res.body);
  })
  .catch((err) => {
    console.error('request failed', err);
  });
```

## fh-service-request vs. $fh.service
Switching between *$fh.service* and *fh-service-request* is relatively easy. The
primary differences are:

* *path* parameter is named *uri*
* *params* is not used in *fh-service-request*, use *json* or *qs* instead
* *fh-service-request* is supplied the *guid* once only - when being created
* *fh-service-request* supports the *request* module API and _pipe_
* *fh-service-request* returns a Promise with the *res* Object the regular
request module provides.
* *fh-service-request* can be passed a *pipe* flag in the request options to
return the regular *request* instance for piping data.

### $fh.service

```js
var $fh = require('fh-mbaas-api');

$fh.service({
  method: 'GET',
  path: '/data',
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
}, function (err, body, res) {});
```

### fh-service-request

*fh-service-request* is a factory function that returns *request* instances that
target a single MBaaS. This means you don't need to pass the *guid* in with
each request, instead just at creation time.

Due to the fact that *fh-service-request* is a thin wrapper around *request*
you can even do fancy stuff such as using _req.pipe_, and use shorthand methods
such as _req.get_.

```js
var request = require('fh-service-request')({
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
});

request({
  method: 'GET',
  uri: '/data'
})
  .then((res) => {
    // check res.statusCode
  })
  .catch((err) => {
    console.error('request failed', err);
  });
```


## Local Development

During local development you might want to redirect a request to an alternative
host, and not hit your Red Hat Mobile instance. In the past, with $fh.service,
this was done using an environment variable named *FH_SERVICE_MAP*, but to keep
things simple, this module will use an _fhconfig.json_ file in the root of your
project to resolve development URLs.

Here's a sample file:

```json
{
  "domain": "your-domain.feedhenry.com",
  "appId": "the id of this app from the app details screen",
  "apiKey": "the api key from the app details screen",
  "services": {
    "48fhsf6mxzlyqi3ffbpkfh38": {
      "devUrl": "http://127.0.0.1:8001/",
      "name": "MY_AUTH_SERVICE"
    }
  }
}

```

The _services[GUID].devUrl_ property is used when your application is running
locally to redirect requests to a host of your choosing.


## fhconfig.json

The fhconfig.json is a general configuration file we can use to manage Red
Hat Mobile specific node.js application settings.

Here's a sample:

```json
{
  "domain": "your-domain.feedhenry.com",
  "appId": "the id of this app from the app details screen",
  "apiKey": "the api key from the app details screen",
  "services": {
    "48fhsf6mxzlyqi3ffbpkfh38": {
      "devUrl": "http://127.0.0.1:8001/",
      "name": "MY_AUTH_SERVICE"
    }
  }
}
```

And a description of the keys:

#### domain
The domain your application is running on

#### services
Contains keys that manage MBaaS Service interaction

#### services[GUID]
Contains information related to specific MBaaS components identified by their,
AppID or GUID.

#### services[GUID].name
A name you might assign to identity an MBaaS. This can be used in place of the
GUID when making calls to services for improved readability.

#### services[GUID].devUrl
Used to point MBaaS requests to a custom host during local development.

## Piping Data

```js
const fs = require('fs');
const serviceCall = require('fh-service-request')({
  // This will be resolved to a GUID in fhconfig.json for us. Magic.
  name: '48fhsf6mxzlyqi3ffbpkfh38'
});

serviceCall({
  pipe: true,
  uri: '/get-data'
})
  .then((request) => {
    // Write data to the file in chunks as it arrives
    request.pipe(fs.createWriteStream('./response-data.txt'));
  });
```

## Using Names for MBaaS Services

```js
var authMbaasRequest = require('fh-service-request')({
  // This will be resolved to a GUID in fhconfig.json for us. Magic.
  name: 'MY_AUTH_SERVICE'
});

// Make a HTTP request to GET /tasks?owner=feedhenry
authMbaasRequest({
  method: 'POST',
  uri: '/login',
  json: true,
  body: {
    user: 'feedhenry',
    pass: 's3cr3tpassw0rd'
  }
}).then(successFn).catch(erroFn);
```

## CHANGELOG

* 0.2.0
  * Fix bug where if you created multiple instances all requests went to just a
  single mBaaS.
  * Temporarily remove support for `request.defaults`, `request.get`, etc.

* 0.1.4
  * Add logging using the `debug` module.

* 0.1.3
  * Ensure required headers are included with requests.

* 0.1.0
  * Fix bug where multiple instances causes recursive `request.init` calls
  * Improve test coverage

* 0.1.0 - Initial release
