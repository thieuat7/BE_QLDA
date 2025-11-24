import express from 'express';
import path from 'path';

const ViewEngine = (app) => {
    app.set('views', './src/views');
    app.set('view engine', 'ejs');
    app.use(express.static(path.join('./src/public')));
}
export default ViewEngine;
