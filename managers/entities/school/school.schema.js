module.exports = {
  createSchool: [
    {
      model: 'text',
      path: 'name',
      required: true,
    },
    {
      model: 'longText',
      path: 'address',
      required: true,
    },
    {
      model: 'phone',
      path: 'phone',
      required: true,
    },
  ],
  getSchool: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  updateSchool: [
    {
      model: 'text',
      path: 'name',
    },
    {
      model: 'longText',
      path: 'address',
    },
    {
      model: 'phone',
      path: 'phone',
    },
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  deleteSchool: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
};
