const mongoose = require('mongoose');

// Define the availability schema for professors
const availabilitySchema = new mongoose.Schema({
    professor: {
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
    isBooked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add index for efficient querying
availabilitySchema.index({ professor: 1, startTime: 1 });

// Validate that endTime is after startTime
availabilitySchema.pre('save', function(next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    }
    next();
});

const Availability = mongoose.model('Availability', availabilitySchema);
module.exports = Availability; 