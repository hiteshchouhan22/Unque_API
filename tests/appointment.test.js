require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('../routes/auth');
const appointmentRoutes = require('../routes/appointments');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

describe('Appointment System E2E Test', () => {
    let server;
    let studentA1Token, studentA2Token, professorP1Token;
    let professorP1Id, availabilityId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
        const PORT = 3001;
        server = app.listen(PORT);
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    beforeEach(async () => {
        const testEmails = ['professor1@test.com', 'studentA1@test.com', 'studentA2@test.com'];
        const testUsers = await User.find({ email: { $in: testEmails } });
        const testUserIds = testUsers.map(user => user._id);

        await Promise.all([
            User.deleteMany({ email: { $in: testEmails } }),
            Appointment.deleteMany({ 
                $or: [
                    { professor: { $in: testUserIds } },
                    { student: { $in: testUserIds } }
                ]
            }),
            Availability.deleteMany({ professor: { $in: testUserIds } })
        ]);
    });

    test('Complete appointment booking and cancellation flow', async () => {
        // 1. Register users
        const professorResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'professor1',
                password: 'password123',
                email: 'professor1@test.com',
                role: 'professor'
            });
        
        expect(professorResponse.status).toBe(201);
        professorP1Token = professorResponse.body.token;
        professorP1Id = professorResponse.body.user.id;

        const studentA1Response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'studentA1',
                password: 'password123',
                email: 'studentA1@test.com',
                role: 'student'
            });
        
        expect(studentA1Response.status).toBe(201);
        studentA1Token = studentA1Response.body.token;

        const studentA2Response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'studentA2',
                password: 'password123',
                email: 'studentA2@test.com',
                role: 'student'
            });
        
        expect(studentA2Response.status).toBe(201);
        studentA2Token = studentA2Response.body.token;

        // 2. Professor adds availability
        const timeSlot1 = new Date();
        timeSlot1.setHours(timeSlot1.getHours() + 1);
        const timeSlot1End = new Date(timeSlot1);
        timeSlot1End.setHours(timeSlot1End.getHours() + 1);

        const timeSlot2 = new Date(timeSlot1End);
        timeSlot2.setHours(timeSlot2.getHours() + 1);
        const timeSlot2End = new Date(timeSlot2);
        timeSlot2End.setHours(timeSlot2End.getHours() + 1);

        const availabilityResponse = await request(app)
            .post('/api/appointments/availability')
            .set('Authorization', `Bearer ${professorP1Token}`)
            .send({
                startTime: timeSlot1,
                endTime: timeSlot1End
            });
        
        expect(availabilityResponse.status).toBe(201);
        availabilityId = availabilityResponse.body.availability._id;

        const availability2Response = await request(app)
            .post('/api/appointments/availability')
            .set('Authorization', `Bearer ${professorP1Token}`)
            .send({
                startTime: timeSlot2,
                endTime: timeSlot2End
            });
        
        expect(availability2Response.status).toBe(201);

        // 3. Student A1 views available slots
        const slotsResponse = await request(app)
            .get(`/api/appointments/availability/${professorP1Id}`)
            .set('Authorization', `Bearer ${studentA1Token}`);
        
        expect(slotsResponse.status).toBe(200);
        expect(slotsResponse.body.length).toBe(2);

        // 4. Student A1 books first appointment
        const bookingResponse = await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${studentA1Token}`)
            .send({
                availabilityId: availabilityId
            });
        
        expect(bookingResponse.status).toBe(201);
        const appointmentId = bookingResponse.body.appointment._id;

        // 5. Student A2 books second appointment
        const booking2Response = await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${studentA2Token}`)
            .send({
                availabilityId: availability2Response.body.availability._id
            });
        
        expect(booking2Response.status).toBe(201);

        // 6. Professor cancels appointment with Student A1
        const cancelResponse = await request(app)
            .post(`/api/appointments/cancel/${appointmentId}`)
            .set('Authorization', `Bearer ${professorP1Token}`);
        
        expect(cancelResponse.status).toBe(200);

        // 7. Student A1 checks appointments
        const appointmentsResponse = await request(app)
            .get('/api/appointments/my-appointments')
            .set('Authorization', `Bearer ${studentA1Token}`);
        
        expect(appointmentsResponse.status).toBe(200);
        expect(appointmentsResponse.body.length).toBe(1);
        expect(appointmentsResponse.body[0].status).toBe('cancelled');
    });
}); 