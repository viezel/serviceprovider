'use strict';
/**
 * @file
 * Suggest Transformers
 *
 * The file contains several transformer functions:
 *
 *  * creatorSuggestTransformer
 *    Returns creator suggestions based on query
 *  * librarySuggestTransformer
 *    Returns library suggestions based on query
 *  * subjectSuggestTransformer
 *    Returns subject suggestions based on query
 *  * popSuggestTransformer
 *    Returns solr documents sorted according to loan count
 *  * suggestTransformer
 *    Transformer bsaed on the above mentioned transformers.
 *    The suggestTransformer supports 4 types of suggestions:
 *    creator, library, subject and title
 */

import {clone} from 'lodash';
import genericTransformer from '../genericTransformer.js';
import entitySuggest from '../services/EntitySuggest/neoClient.js';
import popSuggest from '../services/PopSuggest/client.js';
import {die} from '../utils.js';

/**
* Transformer for subjectSuggest endpoint.
* This transformer calls the entitySuggest client and returns subject
* suggestions
*/
export function subjectSuggestRequest(request, context, state) { // eslint-disable-line no-unused-vars
  let clientRequest = {query: request.q, n: request.limit};
  return {transformedRequest: clientRequest, state: state};
}

export function subjectSuggestResponse(response, context, state) { // eslint-disable-line no-unused-vars
  return {statusCode: 200, data: response.response.suggestions.map((obj) => {
    return {str: obj.suggestion};
  })};
}

export function subjectSuggestFunction(context) {
  let contextCopy = clone(context.entitySuggest);
  let client = entitySuggest(contextCopy);
  return (request, localContext, state) => { // eslint-disable-line no-unused-vars
    return {response: client.getSubjectSuggestions(request), state: state};
  };
}

export function subjectSuggestTransformer() {
  return genericTransformer(subjectSuggestRequest,
                            subjectSuggestResponse,
                            subjectSuggestFunction);
}


/**
* Transformer for creatorSuggest endpoint.
* This transformer calls the entitySuggest client and returns creator
* suggestions
*/
export function creatorSuggestRequest(request, context, state) { // eslint-disable-line no-unused-vars
  let clientRequest = {query: request.q, n: request.limit};
  return {transformedRequest: clientRequest, state: state};
}

export function creatorSuggestResponse(response, context, state) { // eslint-disable-line no-unused-vars
  return {statusCode: 200, data: response.response.suggestions.map((obj) => {
    return {str: obj.suggestion};
  })};
}

export function creatorSuggestFunction(context) {
  let contextCopy = clone(context.entitySuggest);
  let client = entitySuggest(contextCopy);
  return (request, localContext, state) => { // eslint-disable-line no-unused-vars
    return {response: client.getCreatorSuggestions(request), state: state};
  };
}

export function creatorSuggestTransformer() {
  return genericTransformer(creatorSuggestRequest,
                            creatorSuggestResponse,
                            creatorSuggestFunction);
}


/**
* Transformer for librarySuggest endpoint.
* This transformer calls the entitySuggest client and returns library
* suggestions
*/
export function librarySuggestRequest(request, context, state) { // eslint-disable-line no-unused-vars
  let clientRequest = {query: request.q, n: request.limit};
  return {transformedRequest: clientRequest, state: state};
}

export function librarySuggestResponse(response, context, state) { // eslint-disable-line no-unused-vars
  return {statusCode: 200, data: response.response.suggestions.map((obj) => {
    obj.suggestion.str = obj.suggestion.navn + ', ' + obj.suggestion.by;
    return obj.suggestion;
  })};
}

export function librarySuggestFunction(context) {
  let contextCopy = clone(context.entitySuggest);
  let client = entitySuggest(contextCopy);
  return (request, localContext, state) => { // eslint-disable-line no-unused-vars
    return {response: client.getLibrarySuggestions(request), state: state};
  };
}

export function librarySuggestTransformer() {
  return genericTransformer(librarySuggestRequest,
                            librarySuggestResponse,
                            librarySuggestFunction);
}


/**
* Transformer for popSuggest endpoint.
* This transformer calls the popSuggestion client and returns solr
* document suggestions
*/
export function popSuggestRequest(request, context, state) { // eslint-disable-line no-unused-vars
  let clientRequest = {query: request.q, rows: request.limit, fields: request.fields};
  return {transformedRequest: clientRequest, state: state};
}

export function popSuggestResponse(response, context, state) { // eslint-disable-line no-unused-vars
  return {statusCode: 200, data: response};
}

export function popSuggestFunction(context) {
  let contextCopy = clone(context.popSuggest);
  let client = popSuggest(contextCopy);
  return (request, localContext, state) => { // eslint-disable-line no-unused-vars
    return {response: client.getPopSuggestions(request), state: state};
  };
}

export function popSuggestTransformer() {
  return genericTransformer(popSuggestRequest,
                            popSuggestResponse,
                            popSuggestFunction);
}


/**
* Transformer for suggest endpoint.
*
* This transformer calls the appropriate suggesttransformer based on
* the type parameter in the request, and returns the fetched
* suggestions.
*
* Available types are: creator, library, subject and title
*/


export function suggestRequest(request, context, state) { // eslint-disable-line no-unused-vars

  state.type = request.type;
  let requestEnvelope = {type: request.type,
                         request: {q: request.q,
                                   limit: request.limit}};

  if (requestEnvelope.type === 'title') {
    requestEnvelope.request.fields = 'display.title,fedoraPid,display.creator,display.workType';
    requestEnvelope.request.q = 'display.title:{!complexphrase inOrder=true}' + requestEnvelope.request.q;
  }
  return {transformedRequest: requestEnvelope, state: state};
}

function mapTitleKeys(obj) {
  let retObj = {str: obj['display.title'][0], id: obj.fedoraPid};
  if (obj.hasOwnProperty('display.creator')) {
    retObj.creator = obj['display.creator'][0];
  }
  if (obj.hasOwnProperty('display.workType')) {
    retObj.type = obj['display.workType'][0];
  }
  return retObj;
}

export function suggestResponse(response, context, state) { // eslint-disable-line no-unused-vars
  let statusCode = response.statusCode;
  if (state.type === 'title') {
    response.data = response.data.response.docs.map((obj) => {
      return mapTitleKeys(obj);
    });
  }
  return {statusCode: statusCode, data: response.data};
}

export function suggestFunction(context) {

  let transformers = {subject: subjectSuggestTransformer(),
                      creator: creatorSuggestTransformer(),
                      library: librarySuggestTransformer(),
                      title: popSuggestTransformer()};

  return (requestEnvelope, localContext, state) => { // eslint-disable-line no-unused-vars
    if (!transformers.hasOwnProperty(requestEnvelope.type)) {
      die('SuggestFunction "' + requestEnvelope.type + '" is unknown');
    }

    return {response: transformers[requestEnvelope.type](requestEnvelope.request, context),
            state: state};
  };
}

export function suggestTransformer() {

  return genericTransformer(suggestRequest,
                            suggestResponse,
                            suggestFunction);
}