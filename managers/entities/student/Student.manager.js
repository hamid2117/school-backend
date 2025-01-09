module.exports = class Student {
  constructor({ utils, cache, managers, validators, oyster } = {}) {
    this.utils = utils;
    this.cache = cache;
    this.oyster = oyster;
    this.shark = managers.shark;
    this.validators = validators;
    this.responseDispatcher = managers.responseDispatcher;
    this._label = 'students';
    this.httpExposed = [
      'createStudent',
      'get=getStudent',
      'patch=updateStudent',
      'delete=deleteStudent',
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
    nodeId = 'board.school.classRoom.student',
  }) {
    const user = await this._getUser({ userId });
    if (user.error) return user;

    const allowed = await this.shark.isGranted({
      layer: 'board.school.classRoom.student',
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return { error: allowed ? undefined : 'Permission denied' };
  }
  async createStudent({ name, gender, classroomId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateStudent = await this._validatePermission({
      userId,
      action: 'create',
    });

    if (canCreateStudent.error) {
      return canCreateStudent;
    }

    const toCreateStudent = { name, gender, classroomId };

    // Data validation
    let result = await this.validators.student.createStudent(toCreateStudent);

    if (result) return result;

    // Creation
    const createdStudent = await this.oyster.call('add_block', {
      ...toCreateStudent,
      _label: this._label,
    });

    if (createdStudent.error) {
      console.error('Failed to create student', created.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: 'Failed to create student',
      });
      return { selfHandleResponse: true };
    }

    // Response
    return { student: createdStudent };
  }

  async getStudent({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;

    // Permission check
    const canGetStudent = await this._validatePermission({
      userId,
      action: 'read',
    });

    if (canGetStudent.error) {
      return canGetStudent;
    }

    // Data validation
    let validationResult = await this.validators.student.getStudent({ id });

    if (validationResult) return result;

    const student = await this.oyster.call('get_block', `${id}`);

    // Check if exists
    if (!student || this.utils.isObjEmpty(student)) {
      this.responseDispatcher.dispatch(res, {
        code: 404,
        message: 'student not found',
      });
      return { selfHandleResponse: true };
    }

    // Response
    return student;
  }

  async updateStudent({ id, name, gender, classroomId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateStudent = await this._validatePermission({
      userId,
      action: 'update',
    });

    if (canUpdateStudent.error) {
      return canUpdateStudent;
    }

    const toUpdateStudent = { name, gender, classroomId };

    // Data validation
    let result = await this.validators.student.updateStudent({
      ...toUpdateStudent,
      id,
    });

    if (result) return result;

    // Creation Logic
    const updatedStudent = await this.oyster.call('update_block', {
      ...toUpdateStudent,
      _id: id,
      _label: this._label,
    });

    if (updatedStudent.error) {
      console.error('Failed to update student', updatedStudent.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: 'Failed to update student',
      });
      return { selfHandleResponse: true };
    }

    // Response
    return updatedStudent;
  }

  async deleteStudent({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;
    // Permission check
    const canDeleteStudent = await this._validatePermission({
      userId,
      action: 'delete',
    });

    if (canDeleteStudent.error) {
      return canDeleteStudent;
    }

    // Data validation
    let result = await this.validators.student.getStudent({ id });
    if (result) return result;

    const deletedStudent = await this.oyster.call('delete_block', id);
    if (deletedStudent.error) {
      console.error('Failed to delete student', deletedStudent.error);
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: 'Failed to delete student',
      });
      return { selfHandleResponse: true };
    }

    // Response
    return { message: 'Student deleted successfully' };
  }
};
