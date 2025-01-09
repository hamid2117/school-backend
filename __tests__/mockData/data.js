const mockUsers = {
  superAdmin: {
    userName: 'superAdmin',
    email: 'superAdmin@mail.com',
    password: '123456789',
    role: 'superAdmin',
    _id: 'user:superAdmin@mail.com',
    _label: 'user',
  },
  institutionAdmin: {
    userName: 'instituteAdmin',
    email: 'admina@mail.com',
    password: '123456789',
    role: 'admin',
    _id: 'user:admina@mail.com',
    _label: 'user',
  },
  regularUser: {
    userName: 'auser',
    email: 'ausera@mail.com',
    password: '123456789',
    role: 'user',
    _id: 'user:ausera@mail.com',
    _label: 'user',
  },
};

const mockSchoolData = {
  school: {
    name: 'Test School',
    address: '123 Test St',
    phone: '+212345678910',
  },
  classroom: {
    capacity: 30,
    grade: 1,
    academicYear: '2024-2025',
  },
  student: {
    name: 'John Doe',
    gender: 'male',
  },
};

module.exports = { mockUsers, mockSchoolData };
