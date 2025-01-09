module.exports = {
  createStudent: [
    {
      path: 'name',
      type: 'String',
      length: { min: 1, max: 50 },
      required: true,
    },
    {
      model: 'gender',
      path: 'gender',
      required: true,
    },
    {
      path: 'classId',
      type: 'String',
      required: true,
    },
  ],
  getStudent: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  updateStudent: [
    {
      path: 'name',
      type: 'String',
      length: { min: 1, max: 50 },
      required: true,
    },
    {
      model: 'gender',
      path: 'gender',
      required: true,
    },
    {
      path: 'classId',
      type: 'String',
      required: true,
    },
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  deleteStudent: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
};
