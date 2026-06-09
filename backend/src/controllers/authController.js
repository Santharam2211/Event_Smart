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
        const { username, email, password, registrationNumber, phone, bio, skills, dateOfBirth, signature, gender, yearAndDept, section } = req.body;

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
            registrationNumber: registrationNumber || undefined,
            phone: phone || undefined,
            bio: bio || '',
            skills: skills || [],
            dateOfBirth: dateOfBirth || undefined,
            signature: signature || '',
            gender: gender || 'Male',
            yearAndDept: yearAndDept || 'I B.E. CSE',
            section: section || 'A',
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
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
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

// @desc    Create an Association Member account (Admin only)
// @route   POST /api/auth/create-association-member
// @access  Private/Admin
exports.createAssociationMember = async (req, res, next) => {
    try {
        const { 
            username, email, password, registrationNumber, 
            phone, gender, yearAndDept, section, membershipStatus 
        } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        const member = await User.create({
            username,
            email,
            password,
            role: 'Association Member',
            registrationNumber,
            phone,
            gender,
            yearAndDept,
            section,
            membershipStatus: membershipStatus || 'Present'
        });

        if (member) {
            res.status(201).json({
                _id: member._id,
                username: member.username,
                email: member.email,
                role: member.role,
                registrationNumber: member.registrationNumber,
                phone: member.phone,
                gender: member.gender,
                yearAndDept: member.yearAndDept,
                section: member.section,
                membershipStatus: member.membershipStatus
            });
        } else {
            res.status(400);
            throw new Error('Failed to create member account');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update member status (Admin only)
// @route   PUT /api/auth/member-status/:id
// @access  Private/Admin
exports.updateMemberStatus = async (req, res, next) => {
    try {
        const { membershipStatus } = req.body;
        const user = await User.findById(req.params.id);

        if (user && user.role === 'Association Member') {
            user.membershipStatus = membershipStatus;
            await user.save();
            res.json({ message: `Status updated to ${membershipStatus}` });
        } else {
            res.status(404);
            throw new Error('Member not found');
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
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
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
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
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
        const { username, phone, bio, skills, registrationNumber, dateOfBirth, signature, gender, yearAndDept, section } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = username || user.username;
            user.phone = phone || undefined;
            user.bio = bio !== undefined ? bio : user.bio;
            if (skills !== undefined) {
                user.skills = typeof skills === 'string'
                    ? skills.split(',').map(s => s.trim()).filter(Boolean)
                    : skills;
            }
            user.registrationNumber = registrationNumber || undefined;
            user.dateOfBirth = dateOfBirth || undefined;
            // If signature file was uploaded, use the filename
            if (req.file) {
                user.signature = req.file.filename;
            } else if (signature) {
                user.signature = signature;
            }
            user.gender = gender || user.gender;
            user.yearAndDept = yearAndDept || user.yearAndDept;
            user.section = section || user.section;

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
                gender: updatedUser.gender,
                yearAndDept: updatedUser.yearAndDept,
                section: updatedUser.section,
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

// @desc    Search for users
// @route   GET /api/auth/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Exclude self
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { registrationNumber: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('username email registrationNumber').limit(10);

        res.json(users);
    } catch (error) {
        next(error);
    }
};

// Export upload middleware for use in routes
exports.upload = upload;
exports.signatureUpload = signatureUpload;
