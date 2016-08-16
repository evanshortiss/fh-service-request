fh-service-request
==================

Like $fh.service, but exposes the full _request_ API meaning you get all of that
goodness that you're used to, plus MBaaS benefits.


## Install

```
npm i fh-service-request --save
```


## Usage

```js
var tasks = require('fh-service-request')({
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
});

// Make a GET request using the regular "request" module API
tasks.get({
  // Normally with the request module we'd pass "url" here, but since we're
  // using fh-service-request the MBaaS URL will be resolved for us and this
  // path will be appended to it
  path: '/tasks',

  // Tell request to parse responses as JSON
  json: true,

  // Query for items owned by "feedhenry" user
  qs: {
    owner: 'feedhenry'
  }
}, function (err, res, tasks) {
  if (err) {
    console.error('request failed', err);
  } else {
    console.log('tasks for "feedhenry"', tasks);
  }
});
```

## fh-service-request vs. $fh.service
Switching between *$fh.service* and *fh-service-request* is relatively easy. The
primary differences are:

* *path* parameter is named *uri*
* *params* is not supported in *fh-service-request*, use *json* or *qs*
* *fh-service-request* is supplied the *guid* once only, when being created
* *fh-service-request* supports the entire *request* module API
* *body* and *res* are now in the same order as *request* passes them

### $fh.service

```js
var $fh = require('fh-mbaas-api');

$fh.service({
  method: 'GET',
  path: '/data',
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
}, function (err, body, res) {

});
```

### fh-service-request

*fh-service-request* is a factory function that returns *request* instances that
target a single MBaaS. This means you don't need to pass the *guid* in with
each request, instead just at creation time.

Due to the fact that *fh-service-request* is a thin wrapper around *request*
you can even do fancy stuff such as using _req.pipe_.

```js
var request = require('fh-service-request')({
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
});

$fh.service({
  method: 'GET',
  uri: '/data',
  guid: '48fhsf6mxzlyqi3ffbpkfh38'
}, function (err, res, body) {

});
```


## Local Development

During local development you might want to redirect a request to an alternative
host, and not hit your Red Hat Mobile instance. In the past, with $fh.service,
this was done using an environment variable named *FH_SERVICE_MAP*, but to keep
things simple, this is now accomplished by adding an _fhconfig.json_ to the root
of your repository.

Here's a sample file:

```json
{
  "domain": "your-domain.feedhenry.com",
  "services": {
    "48fhsf6mxzlyqi3ffbpkfh38": {
      "devUrl": "http://127.0.0.1:8001/",
      "name": "MY_AUTH_SERVICE"
    }
  }
}

```

The _services[GUID].devUrl_ property is used when your application is running locally
to redirect requests to a host of your choosing.


## fhconfig.json

The fhconfig.json is a general configuration file we use to manage Red
Hat Mobile specific node.js application settings.

Here's a sample:

```json
{
  "domain": "your-domain.feedhenry.com",
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


## Using Names for MBaaS Services

```js
var tasks = require('fh-service-request')({
  // This will be resolved to 48fhsf6mxzlyqi3ffbpkfh38 for us. Magic
  name: 'MY_AUTH_SERVICE'
});

// Make a RESTful API call to GET /tasks?owner=feedhenry
tasks.get({
  path: '/tasks',
  json: true,
  qs: {
    owner: 'feedhenry'
  }
}, function (err, res, tasks) {
  console.log(err, tasks);
});
```
