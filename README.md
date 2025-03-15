# College Appointment System

A simple REST API for managing appointments between students and professors.

## Features

- User authentication (students and professors)
- Professor availability management
- Appointment booking system
- Appointment cancellation
- View appointments and available slots

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
   JWT_SECRET=your_jwt_secret_key_here
   ```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Running Tests

```bash
npm test
```

Note: Tests will use the same database as the application but will only create and delete test data with specific test emails.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user (student/professor)
- POST `/api/auth/login` - Login user

### Appointments
- POST `/api/appointments/availability` - Add professor availability (Professor only)
- GET `/api/appointments/availability/:professorId` - Get professor's available slots
- POST `/api/appointments/book` - Book an appointment (Student only)
- POST `/api/appointments/cancel/:appointmentId` - Cancel an appointment (Professor only)
- GET `/api/appointments/my-appointments` - Get user's appointments

## Sample API Usage

1. Register a professor:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "professor1",
    "password": "password123",
    "email": "professor1@test.com",
    "role": "professor"
  }'
```

2. Register a student:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123",
    "email": "student1@test.com",
    "role": "student"
  }'
```

3. Add professor availability:
```bash
curl -X POST http://localhost:3000/api/appointments/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <professor_token>" \
  -d '{
    "startTime": "2024-03-20T10:00:00Z",
    "endTime": "2024-03-20T11:00:00Z"
  }'
```

4. Book an appointment:
```bash
curl -X POST http://localhost:3000/api/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{
    "availabilityId": "<availability_id>"
  }'
``` 