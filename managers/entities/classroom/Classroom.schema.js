module.exports = {
  createClassroom: [
    {
      path: 'name',
      type: 'string',
      length: { min: 1, max: 50 },
      required: true,
    },
    {
      path: 'schoolId',
      type: 'String',
      required: true,
    },
  ],
  getClassroom: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  updateClassroom: [
    {
      path: 'name',
      type: 'string',
      length: { min: 1, max: 50 },
      required: true,
    },
    {
      path: 'schoolId',
      type: 'String',
      required: true,
    },
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
  deleteClassroom: [
    {
      type: 'String',
      path: 'id',
      required: true,
    },
  ],
};
