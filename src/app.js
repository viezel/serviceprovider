'use strict';

/**
 * @file
 * Configure and start our server
 */

// Config
import config from '@dbcdk/dbc-config';
import {version} from '../package.json';

// Libraries
import express from 'express';
import path from 'path';
import Logger from 'dbc-node-logger';
import RedisStore from 'connect-redis';
import ServiceProviderSetup from './ServiceProviderSetup.js';

// Middleware
import bodyParser from 'body-parser';
import expressValidator from 'express-validator';
import compression from 'compression';
import expressSession from 'express-session';
import helmet from 'helmet';

// Generation of swagger specification
import swaggerFromSpec from './swaggerFromSpec.js';

module.exports.run = function (worker) {
  // Setup
  const app = express();
  const server = worker.httpServer;
  const ENV = app.get('env');
  const PRODUCTION = ENV === 'production';
  const APP_NAME = process.env.NEW_RELIC_APP_NAME || 'app_name'; // eslint-disable-line no-process-env
  const APPLICATION = 'mobilsoeg';
  const DEFAULT_CONFIG_NAME = 'aarhus'; // used as a fallback config, if none is set by a url.
  const logger = new Logger({app_name: APP_NAME});
  const expressLoggers = logger.getExpressLoggers();

  // Direct requests to app
  server.on('request', app);

  // Setting bodyparser
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  // Helmet configuration
  // TODO: Setup rest of Helmet, in a way that works with the server setup.
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy({setTo: 'Funkys Venner!'}));
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());

  // Port config
  app.set('port', process.env.PORT || 8080); // eslint-disable-line no-process-env

  // EMAIL Redirect requires port to be defined therefore it must come after
  const EMAIL_REDIRECT = process.env.EMAIL_REDIRECT || 'localhost:' + app.get('port'); // eslint-disable-line no-process-env

  // Configure app variables
  let serviceProvider = ServiceProviderSetup(config[process.env.CONFIG_NAME || DEFAULT_CONFIG_NAME], logger, worker); // eslint-disable-line no-process-env
  app.set('serviceProvider', serviceProvider);
  app.set('logger', logger);
  app.set('EMAIL_REDIRECT', EMAIL_REDIRECT);
  app.set('APPLICATION', APPLICATION);
  app.set('Configuration', config);

  // Configure templating
  app.set('views', path.join(__dirname, 'server/templates'));
  app.set('view engine', 'jade');

  // Setting proxy
  app.enable('trust proxy');

  // setting local vars that should be available to our template engine
  app.locals.env = ENV;
  app.locals.version = version;
  app.locals.production = PRODUCTION;
  app.locals.title = config[process.env.CONFIG_NAME || DEFAULT_CONFIG_NAME].applicationTitle || ''; // eslint-disable-line no-process-env
  app.locals.application = APPLICATION;
  app.locals.faviconUrl = APPLICATION === 'mobilsoeg' ? 'https://www.aakb.dk/sites/www.aakb.dk/files/favicon.ico' : '/favicon.ico';

  // Setup environments
  let redisConfig;
  let fileHeaders = {};

  // Redis
  switch (ENV) {
    case 'development':
      redisConfig = config[process.env.CONFIG_NAME || DEFAULT_CONFIG_NAME].sessionStores.redis.development; // eslint-disable-line no-process-env
      break;
    case 'production':
      redisConfig = config[process.env.CONFIG_NAME || DEFAULT_CONFIG_NAME].sessionStores.redis.production; // eslint-disable-line no-process-env
      fileHeaders = {index: false, dotfiles: 'ignore', maxAge: '5 days'};
      break;
    default:
      redisConfig = config[process.env.CONFIG_NAME || DEFAULT_CONFIG_NAME].sessionStores.redis.local; // eslint-disable-line no-process-env
      break;
  }

  let redisStore = RedisStore(expressSession);

  let sessionMiddleware = expressSession({
    store: new redisStore({
      host: redisConfig.host,
      port: redisConfig.port,
      prefix: APP_NAME + '_session_'
    }),
    secret: redisConfig.secret + APP_NAME,
    name: APP_NAME,
    rolling: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: PRODUCTION
    }
  });

  // Adding gzip'ing
  app.use(compression());

  // Setting paths
  app.use(express.static(path.join(__dirname, '../public'), fileHeaders));
  app.use(express.static(path.join(__dirname, '../static'), fileHeaders));

  // Setting logger
  app.use(expressLoggers.logger);

  // Setting Input Validation
  const validatorOptions = {
    customValidators: {
      isEqual: (a, b) => {
        return a === b;
      }
    }
  };
  app.use(expressValidator(validatorOptions));

  // Setting sessions
  app.use(sessionMiddleware);


  // DUMMY context, - TODO: get this from the auth server through token, and preserve through sessions
  let dummyContext = {
    request: {session: {}},
    libdata: {
      kommune: '',
      config: config.aarhus,
      libraryId: (config.aarhus || {}).agency
    }
    // request: {session: req.session},
    // libdata: res.locals.libdata
  };

  // Execute transform
  function callApi(event, query, context, callback) {
    let prom = serviceProvider.trigger(event, query, context);

    // TODO: result from serviceProvider should just be a single promise.
    // fix this in provider
    if (Array.isArray(prom)) {
      console.log('warning', 'result is array, instead of single promise', event); // eslint-disable-line no-console
      if (prom.length !== 1) {
        console.error('error', 'result length is ', prom.length); // eslint-disable-line no-console
      }
      prom = Array.isArray(prom) ? prom : [prom];
    }
    prom[0].then((response) => {
      callback(response);
    }, (error) => {
      callback(error);
    });
  }

  // WebSocket/SocketCluster transport
  worker.on('connection', (connection) => {
    for (let key of serviceProvider.availableTransforms()) {
      connection.on(key, (data, callback) => { // eslint-disable-line no-loop-func
        callApi(key, data, dummyContext, callback);
      });
    }
  });

  // HTTP Transport
  app.use('/api', express.Router().all(['/:event'], (req, res) => {
    const event = req.params.event;
    if (event === 'swagger.json') {
      return swaggerFromSpec().then((response) => {
        res.json(response);
      }, (error) => {
        res.json(error);
      });
    }

    // TODO: should just be req.body, when all endpoints accept object-only as parameter, until then, this hack supports legacy transforms
    const query = Array.isArray(req.body) ? req.body[0] : req.body;

    callApi(event, query, dummyContext, response => res.json(response));
  }));

  // Graceful handling of errors
  app.use((err, req, res, next) => {
    logger.log('error', 'An error occurred! Got following: ' + err);
    console.error('error', 'An error occurred! Got following: ', err); // eslint-disable-line no-console
    console.error(err.stack); // eslint-disable-line no-console
    if (res.headersSent) {
      return next(err);
    }

    res.status(500);
    res.json({error: String(err)});
    res.end();
  });

  // Handle 404's
  app.use((req, res) => {
    res.status(404);
    res.json({error: '404 Not Found'});
    res.end();
  });

  // Setting logger -- should be placed after routes
  app.use(expressLoggers.errorLogger);

  logger.log('debug', '>> Worker PID: ' + process.pid);
  logger.log('debug', 'Server listening on port ' + app.get('port'));
  logger.log('debug', 'NEW_RELIC_APP_NAME: ' + APP_NAME);
  logger.log('debug', 'APPLICATION: ' + APPLICATION);
  logger.log('debug', 'EMAIL_REDIRECT: ' + EMAIL_REDIRECT);
  logger.log('info', 'Versions: ', process.versions);
  logger.log('info', version + ' is up and running');
};
