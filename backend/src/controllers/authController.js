const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { ensureUploadsDir } = require('../utils/ensureUploadsDir');

const uploadsDir = ensureUploadsDir();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new PARTICIPANT (public)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, registrationNumber, phone, bio, skills, dateOfBirth, signature } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        // Public registration is ALWAYS Participant - role cannot be set externally
        const user = await User.create({
            username,
            email,
            password,
            role: 'Participant',
            registrationNumber,
            phone,
            bio,
            skills,
            dateOfBirth,
            signature,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a Volunteer account (Admin only)
// @route   POST /api/auth/create-volunteer
// @access  Private/Admin
exports.createVolunteer = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        const volunteer = await User.create({
            username,
            email,
            password,
            role: 'Volunteer',
        });

        if (volunteer) {
            res.status(201).json({
                _id: volunteer._id,
                username: volunteer.username,
                email: volunteer.email,
                role: volunteer.role,
            });
        } else {
            res.status(400);
            throw new Error('Failed to create volunteer account');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user (all roles)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                profileImage: user.profileImage,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                profileImage: user.profileImage,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { username, phone, bio, skills, registrationNumber, dateOfBirth, signature } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = username || user.username;
            user.phone = phone !== undefined ? phone : user.phone;
            user.bio = bio !== undefined ? bio : user.bio;
            if (skills !== undefined) {
                user.skills = typeof skills === 'string'
                    ? skills.split(',').map(s => s.trim()).filter(Boolean)
                    : skills;
            }
            user.registrationNumber = registrationNumber || user.registrationNumber;
            user.dateOfBirth = dateOfBirth || user.dateOfBirth;
            // If signature file was uploaded, use the filename
            if (req.file) {
                user.signature = req.file.filename;
            } else if (signature) {
                user.signature = signature;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                registrationNumber: updatedUser.registrationNumber,
                phone: updatedUser.phone,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                dateOfBirth: updatedUser.dateOfBirth,
                signature: updatedUser.signature,
                profileImage: updatedUser.profileImage,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Upload profile picture
// @route   POST /api/auth/upload-profile
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('No file uploaded');
        }

        const user = await User.findById(req.user._id);
        if (user) {
            user.profileImage = req.file.filename;
            await user.save();
            res.json({
                profileImage: req.file.filename,
                profileImageUrl: `/uploads/${req.file.filename}`
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const signatureUpload = multer({
    storage: signatureStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Export upload middleware for use in routes
exports.upload = upload;
exports.signatureUpload = signatureUpload;
