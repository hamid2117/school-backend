const bcrypt = require('bcrypt');

module.exports = class Hasher {
  constructor({ config }) {
    this.config = config;
    this.saltRounds = 10;
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
};
