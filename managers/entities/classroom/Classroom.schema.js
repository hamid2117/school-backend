module.exports = {
  createClassroom: [
    {
      model: 'capacity',
      path: 'capacity',
      required: true,
    },
    {
      model: 'grade',
      path: 'grade',
      required: true,
    },
    {
      model: 'academicYear',
      path: 'academicYear',
      required: true,
    },
    {
      type: 'String',
      path: 'schoolId',
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
      model: 'capacity',
      path: 'capacity',
    },
    {
      model: 'grade',
      path: 'grade',
    },
    {
      model: 'academicYear',
      path: 'academicYear',
    },
    {
      path: 'id',
      type: 'String',
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
