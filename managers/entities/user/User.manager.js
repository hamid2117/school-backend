module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.usersCollection = 'users';
    this.userExposed = ['createUser'];
  }

  async createUser({ userName, email, password }) {
    const user = { userName, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    let createdUser = { userName, email, password };
    let longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
      userKey: createdUser.key,
    });

    // Response
    return {
      user: createdUser,
      longToken,
    };
  }
};
