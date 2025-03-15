const mongoose = require('mongoose');

// Define the appointment schema with necessary fields and relationships
const appointmentSchema = new mongoose.Schema({
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

// Add index for efficient querying
appointmentSchema.index({ professor: 1, startTime: 1 });
appointmentSchema.index({ student: 1, startTime: 1 });

// Validate that endTime is after startTime
appointmentSchema.pre('save', function(next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    }
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment; 