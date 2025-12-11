/**
 * Admin Authentication Middleware
 * Checks if the user has an active admin session
 */

const checkAdminAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        // User is authenticated
        return next();
    }

    // User is not authenticated
    res.status(401).json({
        message: 'Unauthorized. Please login.',
        redirect: '/admin/login'
    });
};

module.exports = { checkAdminAuth };
