module.exports = class School {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.cache = cache;
    this.oyster = oyster;
    this.shark = managers.shark;
    this.validators = validators;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = 'schools';
    this.httpExposed = [
      'createSchool',
      'get=getSchool',
      'delete=deleteSchool',
      'patch=updateSchool',
    ];
  }
};
