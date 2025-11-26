import express from 'express';
import authRouter from './authRouter.js';
import userRouter from './userRouter.js';

const InitRouter = (app) => {
    // API routes
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Backend API is running',
            timestamp: new Date().toISOString()
        });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    });
}

export default InitRouter;
