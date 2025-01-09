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
      path: 'classroomId',
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
    },
    {
      model: 'gender',
      path: 'gender',
    },
    {
      path: 'classroomId',
      type: 'String',
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
