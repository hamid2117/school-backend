# School Management System API Documentation

A concise RESTful API for managing schools, classrooms, and students with robust role-based access control (RBAC).

## Table of Contents


1. [Setup Instructions](#setup-instructions)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication Flow](#authentication-flow)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Security Measures](#security-measures)
8. [Deployment](#deployment)
9. [Mock Data](#mock-data)

---

## Features

- **Role-Based Access Control (RBAC)**
- **School Management**
- **Classroom Management with Resource Tracking**
- **Student Profile Management**
- **Secure JWT Authentication (Long & Short Tokens)**
- **User Role Management**

---

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Custom Validators
- **Rate Limiting**: Middleware-based
- **Documentation**: Postman Collection

---

## Setup Instructions

### Prerequisites

- **Node.js**: v20+
- **Docker & Docker Compose**: (Optional)

### Local Development

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd school-management-api
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory:

   ```env
   SERVICE_NAME=school_management
   NODE_ENV=development
   USER_PORT=5111
   LONG_TOKEN_SECRET=your_long_token_secret
   SHORT_TOKEN_SECRET=your_short_token_secret
   NACL_SECRET=your_nacl_secret
   OYSTER_PREFIX=school_
   ```

4. **Run the Application**

   - **Development Mode** (with auto-reload):

     ```bash
     npm run dev
     ```

   - **Production Mode**:

     ```bash
     npm start
     ```

### Docker Deployment

1. **Build and Run with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This sets up:
   - Node.js application
   - API exposed on port `5111`

---

## Database Schema

### Entities and Relationships

Below is a visual representation of the database schema and relationships within the School Management System API.

**Entities:**

- **Users**
- **Schools**
- **Classrooms**
- **Students**

**Relationships:**

- **Users ↔ Schools**: A user can administer multiple schools.
- **Schools ↔ Classrooms**: A school contains multiple classrooms.
- **Schools ↔ Students**: A school enrolls multiple students.
- **Classrooms ↔ Students**: A classroom houses multiple students.

**Diagram:**

```
+-----------+       +-----------+       +--------------+       +------------+
|   Users   |       |  Schools  |       | Classrooms   |       |  Students  |
+-----------+       +-----------+       +--------------+       +------------+
| _id       |<----- | _id       |<----- | _id          |<----- | _id        |
| email     |       | name      |       | capacity     |       | name       |
| username  |       | address   |       | grade        |       | gender     |
| password  |       | phone     |       | academicYear |       | classroomId|
| role      |       | email     |                           
| createdAt |       | createdBy |       | schoolId     |       | createdAt  |
| updatedAt |       | _admins   |       | createdBy    |       | createdBy  |
+-----------+       +-----------+       +--------------+       +------------+
```

---

## API Endpoints

### Authentication & User Management

| Endpoint                      | Method | Description                        | Access        |
| ----------------------------- | ------ | ---------------------------------- | ------------- |
| `/api/user/createUser`        | POST   | Register a new user                | Public        |
| `/api/user/loginUser`         | POST   | Authenticate user and issue tokens | Public        |
| `/api/user/getUser`           | GET    | Retrieve user details              | Authenticated |
| `/api/user/updateUser`        | PATCH  | Update user information            | Authenticated |
| `/api/user/deleteUser`        | DELETE | Remove a user                      | SuperAdmin    |
| `/api/token/v1_createShortToken`| POST | Generate a short-lived access token| Authenticated |

### School Management

| Endpoint                        | Method | Description                    | Access                   |
| ------------------------------- | ------ | ------------------------------ | ------------------------ |
| `/api/school/createSchool`      | POST   | Add a new school               | SuperAdmin               |
| `/api/school/getSchool`         | GET    | Retrieve school details        | SuperAdmin, Admin        |
| `/api/school/updateSchool`      | PATCH  | Update school information      | SuperAdmin, Admin        |
| `/api/school/deleteSchool`      | DELETE | Remove a school                | SuperAdmin               |

### Classroom Management

| Endpoint                         | Method | Description                       | Access    |
| -------------------------------- | ------ | --------------------------------- | --------- |
| `/api/classroom/createClassroom` | POST   | Create a new classroom             | Admin     |
| `/api/classroom/getClassroom`    | GET    | Retrieve classroom details         | Admin     |
| `/api/classroom/updateClassroom` | PATCH  | Update classroom information       | Admin     |
| `/api/classroom/deleteClassroom` | DELETE | Remove a classroom                 | Admin     |


### Student Management

| Endpoint                             | Method | Description                          | Access |
| ------------------------------------ | ------ | ------------------------------------ | ------ |
| `/api/student/createStudent`         | POST   | Register a new student                | Admin  |
| `/api/student/getStudent`            | GET    | Retrieve student details              | Admin  |
| `/api/student/updateStudent`         | PATCH  | Update student information            | Admin  |
| `/api/student/deleteStudent`         | DELETE | Remove a student from the system      | Admin  |


---

## Authentication Flow

The API utilizes a secure two-tier JWT system for authentication:

1. **Registration/Login**
   - Users register or log in using their email and password.
   - Upon successful authentication, a **Long Token** is issued.

2. **Long Token**
   - **Validity**: 3 years.
   - **Usage**: Create **Short Tokens** and maintain long-term sessions.

3. **Short Token**
   - **Validity**: 1 year.
   - **Usage**: Regular API access, tied to specific devices/user agents.

**Token Inclusion**

Include tokens in the `token` header for protected routes:

```http
token: <token>
```

---

## Error Handling

Consistent error responses facilitate debugging and integration.

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 400  | Bad Request - Invalid input          |
| 401  | Unauthorized - Invalid or missing token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist   |
| 409  | Conflict - Resource already exists   |
| 500  | Internal Server Error                |

**Error Response Format**

```json
{
  "error": "Detailed error message."
}
```

**Example: Unauthorized Access**

```json
{
  "error": "Permission denied."
}
```

---

## Testing

### Test Structure

```
tests/
├── setup.js                     # Initializes test environment
├── helpers/
│   └── utils.js                 # Utility functions for tests
└── schoolManagementSystem.test.js  # Comprehensive test suite
```

### Running Tests

- **Run All Tests**

  ```bash
  npm test
  ```

- **Watch Mode**

  ```bash
  npm run test:watch
  ```

- **Dockerized Tests**

### Test Categories

1. **Unit Tests**
   - Validate individual functions and components.
   - *Example*: Input validators, utility functions.

2. **Authorization Tests**
   - Ensure RBAC policies are correctly enforced.
   - *Example*: Permission checks, token validations.

---

## Security Measures

### Authentication

- **JWT Tokens**: Two-tier tokens for secure session management.
- **Password Hashing**: Uses bcrypt for hashing passwords.
- **Token Expiration**: Defined lifespans to mitigate risks of token theft.

### Authorization

- **RBAC**: Strict role-based access controls.
- **Scoped Access**: School admins limited to their institutions.

### Rate Limiting

- **IP-Based Limits**: Controls request rates per IP.
- **Endpoint-Specific Limits**: Configurable per API endpoint.
- **Middleware Integration**: Efficient tracking and enforcement.

### Input Validation

- **Schema Validation**: Ensures data integrity.
- **Data Sanitization**: Prevents injection attacks.
- **Type Enforcement**: Matches expected data types.

---

## Deployment

### Production Deployment Steps

1. **Build Docker Image**

   ```bash
   docker build -t school-management-api .
   ```

2. **Push to Container Registry**

   ```bash
   docker tag school-management-api your-registry/school-management-api
   docker push your-registry/school-management-api
   ```

3. **Deploy with Docker Compose**

   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Environment Variables

| Variable             | Description                          | Default                |
| -------------------- | ------------------------------------ | ---------------------- |
| `SERVICE_NAME`       | Identifier for the service           | `school_management`    |
| `NODE_ENV`           | Application environment              | `development`          |
| `USER_PORT`          | Port on which the API runs           | `5111`                 |
| `LONG_TOKEN_SECRET`  | Secret key for long-lived JWT tokens | *Your_Long_Token_Secret* |
| `SHORT_TOKEN_SECRET` | Secret key for short-lived JWT tokens| *Your_Short_Token_Secret* |
| `NACL_SECRET`        | Additional encryption secret         | *Your_NACL_Secret*     |
| `OYSTER_PREFIX`      | Key prefix for Oyster DB             | `school_`              |

**Note**: Replace placeholder values with your actual secrets.

---

## Mock Data

### Users

```javascript
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
```

### School Data

```javascript
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
```
