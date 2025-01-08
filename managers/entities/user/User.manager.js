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
    this.hasher = managers.hasher;
    this.validators = validators;
    this.oyster = oyster;
    this.tokenManager = managers.token;
    this.responseDispatcher = managers.responseDispatcher;
    this.shark = managers.shark;
    this.usersCollection = 'users';
    this.userExposed = ['createUser'];
    this._label = 'user';
    this.httpExposed = ['createUser'];
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
    let result = await this.validators.user.createUser({
      userName,
      email,
      password,
      role,
    });
    if (result) return result;

    // Creation Logic
    const hashedPassword = await this.hasher.hashPassword(password);
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
};
