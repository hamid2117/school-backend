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
    nodeId = 'board.school.classRoom',
  }) {
    const user = await this._getUser({ userId });
    if (user.error) return user;

    const allowed = await this.shark.isGranted({
      layer: 'board.school.classRoom',
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return { error: allowed ? undefined : 'Permission denied' };
  }
  async createClassroom({
    __token,
    schoolId,
    grade,
    capacity,
    academicYear,
    res,
  }) {
    const { userId } = __token;

    const canCreateClassroom = await this._validatePermission({
      userId,
      action: 'create',
    });

    if (canCreateClassroom.error) return canCreateClassroom;

    // Ensure school exists
    const school = await this.oyster.call('get_block', `${schoolId}`);
    if (!school || this.utils.isObjEmpty(school)) {
      return { error: 'School not found' };
    }

    // Validate input
    const validationResult = await this.validators.classroom.createClassroom({
      capacity,
      grade,
      academicYear,
      schoolId,
    });
    if (validationResult) return validationResult;

    // Create Classroom
    const classroomId = nanoid();
    const createdClassroom = await this.oyster.call('add_block', {
      _id: classroomId,
      _label: this._label,
      grade,
      schoolId,
      capacity,
      academicYear,
      createdAt: Date.now(),
      createdBy: userId,
    });

    if (createdClassroom.error) {
      if (createdClassroom.error.includes('already exists')) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: 'Classroom already exists',
        });
        return { selfHandleResponse: true };
      }

      console.error('Failed to create classroom:', createdClassroom.error);
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 500,
        message: 'Failed to create classroom',
      });
      return { selfHandleResponse: true };
    }

    await this.oyster.call('update_relations', {
      _id: school._id,
      add: {
        _members: [`${createdClassroom._id}~1`],
      },
    });

    return { classroom: createdClassroom };
  }

  async getClassroom({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;
    // Permission check
    const canReadClassroom = await this._validatePermission({
      userId,
      action: 'read',
    });

    if (canReadClassroom.error) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: canReadClassroom.error,
      });
      return { selfHandleResponse: true };
    }
    // Get ClassRoom first to check school
    const classroom = await this.oyster.call('get_block', `${id}`);
    if (!classroom || this.utils.isObjEmpty(classroom)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'Classroom not found',
      });
      return { selfHandleResponse: true };
    }

    return { classroom };
  }

  async updateClassroom({ __token, id, capacity, grade, academicYear, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateClassroom = await this._validatePermission({
      userId,
      action: 'update',
    });

    if (canUpdateClassroom.error) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: canUpdateClassroom.error,
      });
      return { selfHandleResponse: true };
    }

    // Validate input
    const validationResult = await this.validators.classroom.updateClassroom({
      capacity,
      grade,
      academicYear,
      id,
    });
    if (validationResult) return validationResult;

    // Get classroom first to check school
    const classroom = await this.oyster.call('get_block', `${id}`);
    if (!classroom || this.utils.isObjEmpty(classroom)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'Classroom not found',
      });
      return { selfHandleResponse: true };
    }

    // Update classroom fields
    const updates = {};
    if (grade) updates.grade = grade;
    if (capacity) updates.capacity = capacity;
    if (academicYear) updates.academicYear = academicYear;
    updates.updatedAt = Date.now();
    updates.updatedBy = userId;

    const updatedClassroom = await this.oyster.call('update_block', {
      _id: classroom._id,
      ...updates,
    });

    return { classroom: updatedClassroom };
  }

  async deleteClassroom({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;

    // Get classroom first to check school
    const classroom = await this.oyster.call('get_block', `${id}`);
    if (!classroom || this.utils.isObjEmpty(classroom)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'Classroom not found',
      });
      return { selfHandleResponse: true };
    }

    // Permission check
    const canDeleteClassroom = await this._validatePermission({
      userId,
      action: 'delete',
    });

    if (canDeleteClassroom.error) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: canDeleteClassroom.error,
      });
      return { selfHandleResponse: true };
    }

    // Check if classroom has students
    const students = await this.oyster.call('nav_relation', {
      _id: classroom._id,
      relation: '_members',
      label: 'student',
      withScores: true,
    });

    if (students && Object.keys(students).length > 0) {
      return { error: 'Cannot delete classroom with existing students' };
    }

    // Delete classroom
    await this.oyster.call('delete_block', classroom._id);

    // Remove classroom from school's relations
    await this.oyster.call('update_relations', {
      _id: `school:${classroom.schoolId}`,
      remove: {
        _members: [classroom._id],
      },
    });

    return { message: 'Classroom deleted successfully' };
  }
};
