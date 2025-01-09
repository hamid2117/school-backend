const { nanoid } = require('nanoid');

module.exports = class School {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.utils = utils;
    this.cache = cache;
    this.oyster = oyster;
    this.shark = managers.shark;
    this.validators = validators;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = 'school';
    this.httpExposed = [
      'createSchool',
      'get=getSchool',
      'delete=deleteSchool',
      'patch=updateSchool',
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
  async createSchool({ __token, name, address, phone, email, res }) {
    const { userId } = __token;

    const canCreateSchool = await this._validatePermission({
      userId,
      action: 'create',
    });

    if (canCreateSchool.error) {
      return canCreateSchool;
    }

    // Validate inputs
    const validationResult = await this.validators.school.createSchool({
      name,
      address,
      phone,
      email,
    });
    if (validationResult) return validationResult;

    // Create School
    const schoolId = nanoid();
    const createdSchool = await this.oyster.call('add_block', {
      _id: schoolId,
      _label: this._label,
      name,
      address,
      phone,
      email,
      createdAt: Date.now(),
      createdBy: userId,
      _admins: [`user:${userId}`],
    });

    if (createdSchool.error) {
      if (createdSchool.error.includes('already exists')) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: 'School name already exists',
        });
        return { selfHandleResponse: true };
      }

      console.error('Failed to create school:', createdSchool.error);
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 500,
        message: 'Failed to create school',
      });
      return { selfHandleResponse: true };
    }

    return { school: createdSchool };
  }
  async getSchool({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;

    const canReadSchool = await this._validatePermission({
      userId,
      action: 'read',
      schoolId: id,
    });

    if (canReadSchool.error) {
      return canReadSchool;
    }

    // Get school
    const school = await this.oyster.call('get_block', `${id}`);
    if (!school || this.utils.isObjEmpty(school)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'School not found',
      });
      return { selfHandleResponse: true };
    }

    return { school };
  }
  async updateSchool({ __token, id, name, address, phone, email, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateSchool = await this._validatePermission({
      userId,
      action: 'update',
    });

    if (canUpdateSchool.error) {
      return canUpdateSchool;
    }

    // Validate input
    const validationResult = await this.validators.school.updateSchool({
      id,
      name,
      address,
      phone,
      email,
    });
    if (validationResult) return validationResult;

    // Get school
    const school = await this.oyster.call('get_block', `${id}`);
    if (!school || this.utils.isObjEmpty(school)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'School not found',
      });
      return { selfHandleResponse: true };
    }

    // Update school
    const updates = {};
    if (name) updates.name = name;
    if (address) updates.address = address;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    updates.updatedAt = Date.now();
    updates.updatedBy = userId;

    const updatedSchool = await this.oyster.call('update_block', {
      _id: `${this._label}:${id}`,
      ...updates,
    });

    return { school: updatedSchool };
  }
  async deleteSchool({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;
    // Permission check
    const canDeleteSchool = await this._validatePermission({
      userId,
      action: 'delete',
    });

    if (canDeleteSchool.error) {
      return canDeleteSchool;
    }

    // Get school
    const school = await this.oyster.call('get_block', `${id}`);
    if (!school || this.utils.isObjEmpty(school)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'School not found',
      });
      return { selfHandleResponse: true };
    }

    // Delete school & its relations
    await this.oyster.call('delete_block', `${id}`);
    await this.oyster.call('delete_relations', {
      _id: `${this._label}:${id}`,
    });

    return { message: 'School deleted successfully' };
  }
};
