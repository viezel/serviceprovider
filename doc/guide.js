// # Quick start guide to the open platform
//
// This introduction to getting started with the open platform is online on:
// [https://openplatform.dbc.dk/v0/guide.html#id:secret](https://openplatform.dbc.dk/v0/guide.html#id:secret).
//
// It is written as a literate JavaScript
// [source file](https://openplatform.dbc.dk/v0/guide.js),
// that can be executed directly in the browser.
// Use your client id/secret in the url, and open the browser console
// to see the result of the examples.
//
//

// # Authentication
//
// In order to use the API, we need to acquire an `access_token`.
//
// For this we need various credentials:
//
// - `client_id` - identifies app and library
// - `client_secret` - password connected with the `client_id`
// - `user_id` - library user id (often consisting of 10 digits), or `@` for anonymous user
// - `user_password` - typically the pin for the library user, or just `@` for anonymous users
//

// The `access_token` is retrieved with a HTTP-POST request,
// with `client_id` and `client_secret` supplied through basic authentication,
// and `user_id`, `user_password` supplied in the request body.
// In browser JavaScript this is done with XHR.

var xhr = new XMLHttpRequest();
xhr.open('POST', 'https://auth.dbc.dk/oauth/token');
xhr.setRequestHeader('Authorization',
    'Basic ' + btoa(client_id() + ':' + client_secret()));
xhr.setRequestHeader('Content-Type',
    'application/x-www-form-urlencoded');
xhr.send('grant_type=password' +
    '&username=' + user_id() +
    '&password=' + user_password());



// This request returns a JSON object,
// which has an `access_token` property on success.
// The rest of this guide assume that we have a valid `access_token`

xhr_promise(xhr).then(function(result) {
  var access_token = result.access_token;

// ## Renewal of token
//
// You can renew an `access_token`,
// using only the `client_id` and `client_secret`.
//
// TODO


// # Examples of api-usage
//
// Requests to the API can sent by POSTing a JSON object
// to the API endpoint.
// TODO

function openplatform(endpoint, parameters) {
  xhr = new XMLHttpRequest();
  parameters.access_token = access_token;
  xhr.open('POST', 'https://openplatform.dbc.dk/v0/' + endpoint);
  xhr.send(JSON.stringify(parameters));
  return xhr_promise(xhr);
}

openplatform('search', {q: 'harry'});

// ... search, recommendations, ...
//
// CQL-intro

});
//
// # Boilerplate code
//
// The utility functions used above, is implemented here
// for completeness.

// The example code assumes that the credentials are supplied in
// the url-hash. Here is a quick hack to extract them from the url.

function client_id() {
  return location.hash.split(':')[0].slice(1); }
function client_secret() {
  return location.hash.split(':')[1]; }
function user_id() {
  return location.hash.split(':')[2] || '@'; }
function user_password() {
  return location.hash.split(':')[3] || '@'; }
if(client_id() === 'id' || !client_secret()) {
  throw 'Please use your client_id' +
    ' and client_secret in the url';
}


// A XMLHttpRequest requires setting event handlers
// to get the result of the request.
// Here is a utility function that does the boilerplate
// code, and transforms the XHR-request into a promise.
// It also logs, and parse the result as JSON
// on the way through.

function xhr_promise(xhr) {
  return new Promise(function(resolve, reject) {
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        var result = xhr.response;
        try {
          result = JSON.parse(result);
        } catch(e) {
        }
        console.log(xhr.responseURL, result);
        if(xhr.status === 200) {
          resolve(result);
        } else {
          reject(xhr);
        }
      }
    }
  });
}

// Final note: the code above is written as a tutorial code,
// designed to be simple to read, and get started with,
// rather than proper and correct. It does not follow
// best practices for production code.
