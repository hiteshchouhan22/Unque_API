const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate users using JWT
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Middleware to check if user is a professor
const isProfessor = (req, res, next) => {
    if (req.user.role !== 'professor') {
        return res.status(403).json({ message: 'Access denied. Professors only.' });
    }
    next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied. Students only.' });
    }
    next();
};

module.exports = {
    auth,
    isProfessor,
    isStudent
}; 