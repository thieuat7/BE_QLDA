import express from 'express';
import authRouter from './authRouter.js';
import userRouter from './userRouter.js';
import categoryRouter from './categoryRouter.js';
import productRouter from './productRouter.js';
import cartRouter from './cartRouter.js';
import orderRouter from './orderRouter.js';
import adminOrderRouter from './adminOrderRouter.js';
import discountRouter from './discountRouter.js';
import paymentRouter from './paymentRouter.js';
import statsRouter from './statsRouter.js';
import googleAuthRouter from './googleAuthRouter.js';
import facebookAuthRouter from './facebookAuthRouter.js';
import paymentHistoryRouter from './paymentHistoryRouter.js';
import newsRouter from './newsRouter.js';

const InitRouter = (app) => {
    // API routes
    app.use('/api/auth', authRouter);
    app.use('/api/auth', googleAuthRouter); // Google OAuth routes
    app.use('/api/auth', facebookAuthRouter); // Facebook OAuth routes
    app.use('/api/users', userRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/products', productRouter);
    app.use('/api/cart', cartRouter);
    app.use('/api/orders', orderRouter);
    app.use('/api/admin/orders', adminOrderRouter); // Admin order management
    app.use('/api/discounts', discountRouter);
    app.use('/api/payment', paymentRouter);
    app.use('/api/payment-history', paymentHistoryRouter); // Payment history for users and admin
    app.use('/api/stats', statsRouter);
    app.use('/api/tin-tuc', newsRouter);

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
