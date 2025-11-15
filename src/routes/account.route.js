import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import * as userService from '../services/user.service.js';

const router = express.Router();

router.get('/signup', function(req, res) {
    res.render('accounts/signup', {
        title: 'Sign Up',
        activeNav: 'Sign Up'
    });
});

router.post('/signup', async function(req, res) {
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = {
        full_name: req.body.fullName,
        email: req.body.email,
        password_hash: hashPassword
    }
    
    await userService.add(user);
    res.redirect('/');
});

router.get('/signin', function(req, res) {
    res.render('accounts/signin', {
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', function(req, res) {
    res.redirect('/');
});

export default router;