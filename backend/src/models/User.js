const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['Participant', 'Association Member', 'Admin'],
        default: 'Participant'
    },
    membershipStatus: {
        type: String,
        enum: ['Present', 'Past'],
        default: 'Present'
    },
    registrationNumber: {
        type: String,
        unique: true,
        sparse: true // Only for students/participants if needed
    },
    phone: {
        type: String,
        sparse: true
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    skills: [{
        type: String
    }],
    dateOfBirth: {
        type: Date
    },
    signature: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: 'default-profile.png'
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: 'Male'
    },
    yearAndDept: {
        type: String,
        enum: ['I B.E. CSE', 'II B.E. CSE', 'III B.E. CSE', 'IV B.E. CSE'],
        default: 'I B.E. CSE'
    },
    section: {
        type: String,
        enum: ['A', 'B', 'C'],
        default: 'A'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
