const errorMiddleware = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        err.message = 'File too large. Maximum size is 5MB for profile/signature and 10MB for banners.';
    } else if (err.message && err.message.includes('Images only')) {
        statusCode = 400;
    }
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorMiddleware };
