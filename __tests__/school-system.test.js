const UserManager = require('../managers/entities/user/User.manager');
const SchoolManager = require('../managers/entities/school/School.manager');
const ClassroomManager = require('../managers/entities/classroom/Classroom.manager');
const StudentManager = require('../managers/entities/student/Student.manager');

//mock data
const { mockSchoolData, mockUsers } = require('./mockData/data');
//helpers
const { initializeTestEnvironment, generateUniqueEmail } = require('./helpers');

describe('School System', () => {
  let environment;
  let userManager;
  let schoolManager;
  let classroomManager;
  let studentManager;

  // Store IDs for cross-referencing
  let schoolId;
  let classroomId;
  let studentId;

  beforeAll(async () => {
    environment = await initializeTestEnvironment();

    // Initialize all managers
    userManager = new UserManager({ ...environment });
    schoolManager = new SchoolManager({ ...environment });
    classroomManager = new ClassroomManager({ ...environment });
    studentManager = new StudentManager({ ...environment });

    // Initialize all users
    await userManager.createUser({
      ...mockUsers.superAdmin,
    });
    await userManager.createUser({
      ...mockUsers.institutionAdmin,
    });
    await userManager.createUser({
      ...mockUsers.regularUser,
    });
  });

  afterAll(async () => {
    // Teardown is handled in setup.js
  });

  describe('User Registration and Authentication', () => {
    it('should register users with distinct roles', async () => {
      // Register super admin user
      const adminResult = await userManager.createUser({
        ...mockUsers.superAdmin,
        email: generateUniqueEmail(mockUsers.superAdmin.email),
      });
      expect(adminResult.error).toBeUndefined();

      // Register institution admin
      const instAdminResult = await userManager.createUser({
        ...mockUsers.institutionAdmin,
        email: generateUniqueEmail(mockUsers.institutionAdmin.email),
      });
      expect(instAdminResult.error).toBeUndefined();

      // Register general user
      const generalUserResult = await userManager.createUser({
        ...mockUsers.regularUser,
        email: generateUniqueEmail(mockUsers.regularUser.email),
      });
      expect(generalUserResult.error).toBeUndefined();
    });

    it('should authenticate users correctly', async () => {
      // Test successful login
      const loginSuccess = await userManager.loginUser({
        email: mockUsers.institutionAdmin.email,
        password: mockUsers.institutionAdmin.password,
      });
      expect(loginSuccess.error).toBeUndefined();
      expect(loginSuccess.longToken).toBeDefined();

      // Test failed login
      const loginFailure = await userManager.loginUser({
        email: mockUsers.institutionAdmin.email,
        password: 'incorrectPassword!',
      });
      expect(loginFailure.selfHandleResponse).toBe(true);
    });
  });

  describe('School Operations', () => {
    it('should create and manage a school', async () => {
      // Create school
      const createSchoolResult = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.superAdmin._id },
      });
      expect(createSchoolResult.error).toBeUndefined();
      expect(createSchoolResult.school).toBeDefined();
      schoolId = createSchoolResult.school._id;

      // Update school
      const updateSchoolResult = await schoolManager.updateSchool({
        id: schoolId,
        name: 'Advanced Institute',
        __token: { userId: mockUsers.superAdmin._id },
      });
      expect(updateSchoolResult.error).toBeUndefined();
      expect(updateSchoolResult.school.name).toBe('Advanced Institute');

      // Delete School
      const deletedSchool = await schoolManager.deleteSchool({
        __query: { id: schoolId },
        __token: { userId: mockUsers.superAdmin._id },
      });
      expect(deletedSchool.error).toBeUndefined();
      expect(deletedSchool.message).toBe('School deleted successfully');
    });

    it('should enforce school access permissions', async () => {
      // Create school as admin user
      const schoolResult = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.superAdmin._id },
      });
      schoolId = schoolResult.school._id;

      // Attempt to create school as institution admin (should fail)
      const unauthorizedCreate = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(unauthorizedCreate.error).toBe('Permission denied');

      // Institution admin attempting to view school details without assignment
      const viewWithoutPermission = await schoolManager.getSchool({
        __query: { id: schoolId },
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(viewWithoutPermission.error).toBe('Permission denied');

      // Create another school
      const anotherSchoolResult = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.superAdmin._id },
      });
      const anotherSchoolId = anotherSchoolResult.school._id;

      // Institution admin can't view the  school
      const viewUnassigned = await schoolManager.getSchool({
        __query: { id: anotherSchoolId },
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(viewUnassigned.error).toBe('Permission denied');
    });
  });

  describe('Classroom Operations', () => {
    beforeAll(async () => {
      const schoolResult = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.superAdmin._id },
      });
      schoolId = schoolResult.school._id;
    });

    it('should create and manage classrooms', async () => {
      // Create classroom
      const createClassroomResult = await classroomManager.createClassroom({
        ...mockSchoolData.classroom,
        schoolId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(createClassroomResult.error).toBeUndefined();
      expect(createClassroomResult.classroom).toBeDefined();
      classroomId = createClassroomResult.classroom._id;

      // Update classroom
      const updateClassroomResult = await classroomManager.updateClassroom({
        id: classroomId,
        capacity: 35,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(updateClassroomResult.error).toBeUndefined();
      expect(updateClassroomResult.classroom.capacity).toBe(35);
    });

    it('should enforce classroom deletion', async () => {
      // Create a new classroom
      const testClassroomResult = await classroomManager.createClassroom({
        ...mockSchoolData.classroom,
        name: 'Test Deletion Classroom',
        schoolId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      const testClassroomId = testClassroomResult.classroom._id;

      // Create and add a student
      const testStudentResult = await studentManager.createStudent({
        ...mockSchoolData.student,
        classroomId: testClassroomId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      const testStudentId = testStudentResult.student._id;

      await studentManager.updateStudent({
        id: testStudentId,
        classroomId: testClassroomId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });

      // Remove student first
      await studentManager.deleteStudent({
        __query: { id: testStudentId },
        __token: { userId: mockUsers.institutionAdmin._id },
      });

      // Now deletion classroom
      const deleteSuccess = await classroomManager.deleteClassroom({
        __query: { id: testClassroomId },
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(deleteSuccess.error).toBeUndefined();
      expect(deleteSuccess.message).toBe('Classroom deleted successfully');
    });
  });

  describe('Student Operations', () => {
    beforeEach(async () => {
      // Setup complete school structure
      const schoolResult = await schoolManager.createSchool({
        ...mockSchoolData.school,
        __token: { userId: mockUsers.superAdmin._id },
      });
      schoolId = schoolResult.school._id;

      const classroomResult = await classroomManager.createClassroom({
        ...mockSchoolData.classroom,
        schoolId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      classroomId = classroomResult.classroom._id;
    });

    it('should manage student lifecycle', async () => {
      // Create student
      const createStudent = await studentManager.createStudent({
        ...mockSchoolData.student,
        classroomId,
        schoolId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(createStudent.error).toBeUndefined();
      expect(createStudent.student).toBeDefined();
      studentId = createStudent.student._id;

      // Update student
      const updateStudent = await studentManager.updateStudent({
        id: studentId,
        name: 'Liam Martinez',
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(updateStudent.error).toBeUndefined();
      expect(updateStudent.name).toBe('Liam Martinez');

      // Create another classroom for transfer
      const newClassroom = await classroomManager.createClassroom({
        ...mockSchoolData.classroom,
        name: 'Senior Classroom',
        schoolId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      const newClassroomId = newClassroom.classroom._id;

      // Transfer student
      const transferStudent = await studentManager.updateStudent({
        id: studentId,
        classroomId: newClassroomId,
        __token: { userId: mockUsers.institutionAdmin._id },
      });
      expect(transferStudent.error).toBeUndefined();
    });

    it('should handle student listings', async () => {
      // Create multiple students
      for (let i = 0; i < 3; i++) {
        await studentManager.createStudent({
          ...mockSchoolData.student,
          email: `student${i}@edu.com`,
          classroomId,
          schoolId,
          __token: { userId: mockUsers.institutionAdmin._id },
        });
      }
    });
  });
});
