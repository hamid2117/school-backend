module.exports = {
  createUser: [
    {
      model: 'userName',
      path: 'userName',
      required: true,
    },
    {
      model: 'email',
      path: 'email',
      required: true,
    },
    {
      model: 'password',
      path: 'password',
      required: true,
    },
    {
      model: 'role',
      path: 'role',
      default: 'user',
    },
  ],
  loginUser: [
    {
      model: 'email',
      path: 'email',
      required: true,
    },
    {
      model: 'password',
      path: 'password',
      required: true,
    },
  ],
  getUser: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  updateUser: [
    {
      model: 'userName',
      path: 'userName',
    },
    {
      model: 'email',
      path: 'email',
    },
    {
      model: 'role',
      path: 'role',
    },
  ],
  deleteUser: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
};
