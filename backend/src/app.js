const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { errorMiddleware } = require('./middlewares/errorMiddleware');
const { ensureUploadsDir, UPLOADS_DIR } = require('./utils/ensureUploadsDir');

ensureUploadsDir();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/winners', require('./routes/winnerRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// Error Middleware
app.use(errorMiddleware);

module.exports = app;
