const { nanoid } = require('nanoid');

module.exports = class Classroom {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.utils = utils;
    this.cache = cache;
    this.oyster = oyster;
    this.shark = managers.shark;
    this.validators = validators;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = 'classrooms';
    this.httpExposed = [
      'createClassroom',
      'get=getClassroom',
      'patch=updateClassroom',
      'delete=deleteClassroom',
    ];
  }
  async _getUser({ userId }) {
    const user = await this.oyster.call('get_block', `${userId}`);
    if (!user || this.utils.isObjEmpty(user)) {
      return { error: 'Invalid Token' };
    }
    return user;
  }

  async _validatePermission({
    userId,
    action,
    nodeId = 'board.school',
    schoolId,
  }) {
    const user = await this._getUser({ userId });
    if (user.error) return user;

    if (user.role === 'admin' && schoolId) {
      const admin = await this.oyster.call('nav_relation', {
        _id: `${this._label}:${schoolId}`,
        relation: '_members',
        label: 'user',
        withScores: true,
      });

      if (!admin || !admin[`user:${userId}`]) {
        return { error: 'Permission denied' };
      }
    }

    const allowed = await this.shark.isGranted({
      layer: 'board.school',
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return { error: allowed ? undefined : 'Permission denied' };
  }
};
