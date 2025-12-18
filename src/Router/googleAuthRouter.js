import express from 'express';
import passport from '../config/passport.mjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Redirect to Google OAuth login
// @access  Public
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', {
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
            // Hoặc trả về JSON nếu là API
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);

            // Hoặc trả về JSON
            // res.json({
            //   success: true,
            //   message: 'Login with Google successfully',
            //   token: token,
            //   user: {
            //     id: user.id,
            //     email: user.email,
            //     fullName: user.fullName,
            //     avatar: user.avatar
            //   }
            // });
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
);

// @route   GET /api/auth/google/failure
// @desc    Google OAuth failure
// @access  Public
router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Google authentication failed'
    });
});

export default router;
