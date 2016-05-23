(function() {
  var cycle = require('cycle');
  //var sc;
  sc = false;
  // Current token
  var apiToken;
  var endpoints = [
    "availability",
    "events",
    "facets",
    "libraries",
    "news",
    "order",
    "rank",
    "recommend",
    "renew",
    "search",
    "suggest",
    "user",
    "work"];

  dbcOpenPlatform = {};
  function endpoint(name) {
    return function(params) {
      params = Object.assign({access_token: apiToken}, params);
      console.log('params', params);
      if(!this.connected()) {
        return Promise.reject('need to connect before calling endpoint');
      }
      return new Promise(function(reject, resolve) {
        sc.emit(name, params, function(result, err) {
          console.log('result XXX', typeof(result), result, err);
          e = result;
          result = cycle.retrocycle(result);
          if(!result.statusCode || result.statusCode !== 200) {
            reject(result);
          } else {
            resolve(result);
          }
        });
      });
    };
  }
  for(var i = 0; i < endpoints.length; ++i) {
    dbcOpenPlatform[endpoints[i]] = endpoint(endpoints[i]);
  }

  /**
   * Connect to the DBC open platform.
   * takes token, or client_id,client_secret 
   * or client_id,client_secret,user_id,user_passed
   * as parameters.
   */
  dbcOpenPlatform.connect = function() {
    var promise, args, clientId, clientSecret, user, password;

    args = Array.prototype.slice.call(arguments);
    if(!args.length === 0 && !apiToken) {
      if(!apiToken) {
        throw "missing token to connect";
      }
      promise = Promise.resolve(apiToken);
    } else if(args.length === 1) {
      promise = Promise.resolve(args[0]);
    } else {
      clientId = args[0];
      clientSecret = args[1];
      if(args.length === 2) {
        user = '@';
        password = '@';
      } else if(args.length === 4) {
        user = args[2];
        password = args[3];
      } else {
        throw "dbcOpenPlatform.connect takes 0, 1, 2 or 4 parameters"
      }
      promise = getToken(clientId, clientSecret, user, password);
    }
    return promise.then(function(token) {
      apiToken = token;
      return new Promise(function(resolve, reject) {
        if(sc) {
          sc.on('connectAbort', function() {
            sc = undefined;
            resolve(dbcServiceProvider.connect(token));
          });
          sc.on('connect', function() {
            resolve(token);
          });
          sc.connect();
          return;
        } 
        sc = require('socketcluster-client').connect({
            hostname: 'openplatform.dbc.dk', 
            port: 443,
            secure: true,
            path: '/v0/socketcluster/?access_token=' + token
          });
        sc.on('connectAbort', function(result) {
          reject(result);
        });
        sc.on('connect', function() {
          resolve(token);
        });
      });
    });
  };
  dbcOpenPlatform.disconnect = function() {
    if(sc) {
      sc.disconnect();
    }
  };
  dbcOpenPlatform.connected = function() {
    return sc && sc.state === 'open';
  }
  function getToken(clientId, clientSecret, user, passwd) {
    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://auth.dbc.dk/oauth/token');

    xhr.setRequestHeader('Authorization', 'Basic ' + 
        btoa(client_id() + ':' + client_secret()));

    xhr.setRequestHeader('Content-Type',
        'application/x-www-form-urlencoded');

    xhr.send('grant_type=password' +
        '&username=' + user_id() +
        '&password=' + user_password());

    return new Promise(function(resolve, reject) {
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            var result = xhr.response;
            result = JSON.parse(result).access_token;
            resolve(result);
          } else {
            reject(xhr);
          }
        }
      }
    });

  }

  console.log('here');
})();