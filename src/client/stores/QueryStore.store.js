'use strict';

import Reflux from 'reflux';
import {extend, isString} from 'lodash';
import QueryParser from '../../utils/QueryParser.util.js';
import QueryActions from '../actions/QueryUpdate.action.js';

const defaultStore = {
  queryHasChanged: false,
  query: [],
  page: 0,
  worksPerPage: 12,
  search: '',
  sort: 'default'
};

/**
 * Store containing the current query of the page
 */
let QueryStore = Reflux.createStore({
  store: {
    queryHasChanged: false,
    query: [],
    page: 0,
    worksPerPage: 12,
    search: '',
    sort: 'default'
  },

  listenables: QueryActions,

  triggerOnQueryChange() {
    this.store.search = this.store.query.length && `?${QueryParser.objectToString(this.store.query)}` || '';
    this.store.queryHasChanged = true;
    this.trigger(this.store);
    return this.store;
  },

  setStore(newStore) {
    this.store = newStore;
  },

  getInitialState() {
    return this.store;
  },

  init() {
    if (typeof window !== 'undefined') {
      this.store.query = QueryParser.urlQueryToObject(window.location.search);
      return this.triggerOnQueryChange(this.store);
    }
  },

  onReset() {
    this.store = extend({}, defaultStore);
    this.triggerOnQueryChange(this.store);
  },

  onUpdate(query) {
    this.store.query = isString(query) && QueryParser.urlQueryToObject(query) || query;
    this.store.page = 0;
    this.triggerOnQueryChange(this.store);
  },

  onRemove(query, queryElement) {
    const queryObject = QueryParser.urlQueryToObject(query);
    for (var i = 0; i < queryObject.length; i++) {
      if (queryObject[i].type === queryElement.type && queryObject[i].value === queryElement.value) {
        queryObject.splice(i, 1);
      }
      else if (queryElement.value.length === 0 && queryObject[i].type === queryElement.type) {
        queryObject.splice(i, 1);
      }
    }
    this.store.query = queryObject;
    this.store.page = 0;
    this.triggerOnQueryChange(this.store);
  },

  onAdd(queryElement) {
    this.store.query.push(queryElement);
    this.store.page = 0;
    this.triggerOnQueryChange(this.store);
  },

  onLoadMore() {
    this.onNextPage();
  },

  onNextPage() {
    this.store.page++;
    this.triggerOnQueryChange();
  },

  onPrevPage() {
    this.store.page--;
    this.triggerOnQueryChange();
  },

  onChangedInput(inputValue) {
    this.store.queryHasChanged = false;
    this.store.inputValue = inputValue;
    this.trigger(this.store);
  },

  getCql() {
    return QueryParser.objectToCql(this.store.query);
  }
});

export default QueryStore;
