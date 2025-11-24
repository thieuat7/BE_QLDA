import express from 'express';
const router = express.Router();
import HomePage from '../controller/HomePageController.js';
import LoginPage from '../controller/LoginController.js';

const InitRouter = (app) => {
    router.get('/', HomePage);
    router.get('/login', LoginPage);
    return app.use('/', router);
}

export default InitRouter;
