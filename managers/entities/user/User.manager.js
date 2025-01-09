
const bcrypt = require('bcrypt');
module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    oyster,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.oyster = oyster;
    this.tokenManager = managers.token;
    this.responseDispatcher = managers.responseDispatcher;
    this.shark = managers.shark;
    this.utils = utils;
    this._label = 'user';
    this.httpExposed = [
      'createUser',
      'loginUser',
      'patch=updateUser',
      'delete=deleteUser',
      'get=getUser',
    ];
  }
  async _hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async _verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
  async _getUser({ userId }) {
    return await this.oyster.call('get_block', `${userId}`);
  }
  async _setPermissions({ userId, role }) {
    const addDirectAccess = ({ nodeId, action }) => {
      return this.shark.addDirectAccess({
        userId,
        nodeId,
        action,
      });
    };

    const lookupTable = {
      admin: async () => {
        const items = [
          {
            nodeId: 'board.school',
            action: 'read',
          },
          {
            nodeId: 'board.school.class',
            action: 'update',
          },
          {
            nodeId: 'board.school.class.student',
            action: 'update',
          },
        ];
        for (const item of items) {
          await addDirectAccess(item);
        }
      },
      superAdmin: async () => {
        const items = [
          {
            nodeId: 'board.school',
            action: 'update',
          },
          {
            nodeId: 'board.school.class',
            action: 'config',
          },
          {
            nodeId: 'board.school.class.student',
            action: 'config',
          },
          {
            nodeId: 'board.user',
            action: 'config',
          },
        ];
        for (const item of items) {
          await addDirectAccess(item);
        }
      },
    };

    if (lookupTable[role]) {
      await lookupTable[role]();
    }
  }
  async createUser({ userName, email, password, role = 'user', res }) {
    // Data validation
    const validationResult = await this.validators.user.createUser({
      userName,
      email,
      password,
      role,
    });
    if (validationResult) return validationResult;

    // Creation Logic
    const hashedPassword = await this._hashPassword(password);
    const createdUser = await this.oyster.call('add_block', {
      _id: email,
      _label: this._label,
      userName,
      email,
      password: hashedPassword,
      role,
    });

    if (createdUser.error) {
      console.error('Error creating user:', createdUser.error);
      if (createdUser.error.includes('already exists')) {
        this.responseDispatcher.dispatch(res, {
          code: 409,
          message: 'Email already exists.',
        });
        return { selfHandleResponse: true };
      }
      this.responseDispatcher.dispatch(res, {
        code: 500,
        message: 'Failed to create user',
      });
      return { selfHandleResponse: true };
    }

    // Set permissions based on role
    await this._setPermissions({ userId: email, role });

    let longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
      userKey: createdUser.key,
    });

    const { password: _password, ...userWithoutPassword } = createdUser;

    // Response
    return {
      user: userWithoutPassword,
      longToken,
    };
  }
  async loginUser({ email, password, res }) {
    // Validate input
    const validationResult = await this.validators.user.loginUser({
      email,
      password,
    });
    if (validationResult) return validationResult;

    // Get the user
    const user = await this.oyster.call('get_block', `${this._label}:${email}`);
    if (!user || this.utils.isObjEmpty(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'User not found',
      });
      return { selfHandleResponse: true };
    }

    // Verify Password
    const isPasswordValid = await this._verifyPassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        message: 'Invalid Password',
      });
      return { selfHandleResponse: true };
    }

    // Generate Token
    const longToken = this.tokenManager.genLongToken({
      userId: email,
      userKey: user.key,
    });

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      longToken,
    };
  }

  async getUser({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;

    const currentUser = await this._getUser({ userId });
    // Only user himself or superAdmin or  can view
    const canViewUser =
      userId === id ||
      (await this.shark.isGranted({
        layer: 'board.user',
        action: 'read',
        userId,
        nodeId: `board.user`,
        role: currentUser.role,
      }));

    if (!canViewUser) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: 'Permission denied',
      });
      return { selfHandleResponse: true };
    }

    const user = await this.oyster.call('get_block', `${this._label}:${id}`);
    if (!user || this.utils.isObjEmpty(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'User not found',
      });
      return { selfHandleResponse: true };
    }

    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async updateUser({ __token, id, username, email, password, role, res }) {
    const { userId } = __token;
    const currentUser = await this._getUser({ userId });
    if (role) {
      const canUpdateRole = await this.shark.isGranted({
        layer: 'board.user',
        action: 'config',
        userId,
        nodeId: `board.user`,
        role: currentUser.role,
      });

      if (!canUpdateRole) {
        this.responseDispatcher.dispatch(res, {
          ok: false,
          code: 403,
          message: 'Only superAdmin able to update roles',
        });
        return { selfHandleResponse: true };
      }
    }

    // Validate input
    const validationResult = await this.validators.user.updateUser({
      username,
      email,
      password,
      role,
    });
    if (validationResult) return validationResult;

    // Get the user
    const user = await this.oyster.call('get_block', `${this._label}:${id}`);
    if (!user || this.utils.isObjEmpty(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'User not Found',
      });
      return { selfHandleResponse: true };
    }

    // Update user
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = await this._hashPassword(password);
    if (role) {
      updates.role = role;
      // Update Permissions If Role Changed
      await this._setPermissions({ userId: id, role });
    }
    updates.updatedAt = Date.now();
    updates.updatedBy = userId;

    const updatedUser = await this.oyster.call('update_block', {
      _id: `${this._label}:${id}`,
      ...updates,
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return { user: userWithoutPassword };
  }

  async deleteUser({ __token, __query, res }) {
    const { userId } = __token;
    const { id } = __query;

    const currentUser = await this._getUser({ userId });

    const canDeleteUser = await this.shark.isGranted({
      layer: 'board.user',
      action: 'delete',
      userId,
      nodeId: `board.user`,
      role: currentUser.role,
    });

    if (!canDeleteUser) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: 'Only superAdmin can delete user',
      });
      return { selfHandleResponse: true };
    }

    // Get User
    const user = await this.oyster.call('get_block', `${this._label}:${id}`);
    if (!user || this.utils.isObjEmpty(user)) {
      this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: 'User not found',
      });
      return { selfHandleResponse: true };
    }

    // Delete User & Relations
    await this.oyster.call('delete_block', `${this._label}:${id}`);
    await this.oyster.call('delete_relations', {
      _id: `${this._label}:${id}`,
    });

    return { message: 'User deleted successfully' };
  }
};
