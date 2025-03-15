const express = require('express');
const router = express.Router();
const { auth, isProfessor, isStudent } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');

// Professor adds available time slots
router.post('/availability', [auth, isProfessor], async (req, res) => {
    try {
        const { startTime, endTime } = req.body;

        const availability = new Availability({
            professor: req.user._id,
            startTime: new Date(startTime),
            endTime: new Date(endTime)
        });

        await availability.save();
        res.status(201).json({ message: 'Availability added successfully', availability });
    } catch (error) {
        res.status(500).json({ message: 'Error adding availability', error: error.message });
    }
});

// Get professor's available time slots
router.get('/availability/:professorId', auth, async (req, res) => {
    try {
        const availableSlots = await Availability.find({
            professor: req.params.professorId,
            isBooked: false,
            startTime: { $gt: new Date() }
        }).sort('startTime');

        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability', error: error.message });
    }
});

// Student books an appointment
router.post('/book', [auth, isStudent], async (req, res) => {
    try {
        const { availabilityId } = req.body;

        // Find and update availability
        const availability = await Availability.findById(availabilityId);
        if (!availability || availability.isBooked) {
            return res.status(400).json({ message: 'Time slot not available' });
        }

        // Create appointment
        const appointment = new Appointment({
            professor: availability.professor,
            student: req.user._id,
            startTime: availability.startTime,
            endTime: availability.endTime
        });

        // Mark availability as booked
        availability.isBooked = true;

        await Promise.all([
            appointment.save(),
            availability.save()
        ]);

        res.status(201).json({ message: 'Appointment booked successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error booking appointment', error: error.message });
    }
});

// Professor cancels an appointment
router.post('/cancel/:appointmentId', [auth, isProfessor], async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            professor: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Update appointment status
        appointment.status = 'cancelled';
        await appointment.save();

        // Free up the availability slot
        await Availability.findOneAndUpdate(
            {
                professor: req.user._id,
                startTime: appointment.startTime,
                endTime: appointment.endTime
            },
            { isBooked: false }
        );

        res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
    }
});

// Get user's appointments (works for both students and professors)
router.get('/my-appointments', auth, async (req, res) => {
    try {
        const query = req.user.role === 'student' 
            ? { student: req.user._id }
            : { professor: req.user._id };

        const appointments = await Appointment.find(query)
            .sort('startTime')
            .populate('professor', 'username email')
            .populate('student', 'username email');

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments', error: error.message });
    }
});

module.exports = router; 