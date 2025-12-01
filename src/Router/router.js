import express from 'express';
import authRouter from './authRouter.js';
import userRouter from './userRouter.js';
import categoryRouter from './categoryRouter.js';
import productRouter from './productRouter.js';
import cartRouter from './cartRouter.js';
import orderRouter from './orderRouter.js';
import discountRouter from './discountRouter.js';
import paymentRouter from './paymentRouter.js';

const InitRouter = (app) => {
    // API routes
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/products', productRouter);
    app.use('/api/cart', cartRouter);
    app.use('/api/orders', orderRouter);
    app.use('/api/discounts', discountRouter);
    app.use('/api/payment', paymentRouter);

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
