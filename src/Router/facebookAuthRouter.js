import express from 'express';
import passport from '../config/passport.mjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   GET /api/auth/facebook
// @desc    Redirect to Facebook OAuth login
// @access  Public
router.get('/facebook',
    passport.authenticate('facebook', {
        scope: ['email'],
        session: false
    })
);

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        session: false,
        failureRedirect: '/login'
    }),
    (req, res) => {
        try {
            const user = req.user;

            // Tạo JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Redirect về frontend với token
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/auth/facebook/success?token=${token}`);

        } catch (error) {
            console.error('Facebook OAuth callback error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
);

// @route   GET /api/auth/facebook/failure
// @desc    Facebook OAuth failure
// @access  Public
router.get('/facebook/failure', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Facebook authentication failed'
    });
});

export default router;
