import express from 'express';

const HomePage = (req, res) => {
    res.render('HomePage', { title: 'Home Page' });
}


export default HomePage;
