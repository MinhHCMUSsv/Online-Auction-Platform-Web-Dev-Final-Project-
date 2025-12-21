import express from 'express';
import { engine } from 'express-handlebars';
import hbs_helpers from 'handlebars-helpers';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import { isAuth, isAdmin } from './src/middlewares/auth.mdw.js';

import accountRouter from './src/routes/account.route.js';
import productRouter from './src/routes/product.route.js';

import adminCategoryRouter from './src/routes/admin-category.route.js';
import adminProductRouter from './src/routes/admin-product.route.js';
import adminUserRouter from './src/routes/admin-user.route.js';

const app = express();
const PORT = process.env.PORT || 3000;
const helpers = hbs_helpers();

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}))

app.engine('handlebars', engine({ 
    helpers: {
        helpers,
        section: expressHandlebarsSections(),
        eq: (a, b) => a === b,
        substr: (str, start, length) => {
            if (!str) return '';
            return str.substring(start, start + length);
        },
        formatDate: (date) => {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }
     
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

app.use('/src/static', express.static('src/static'));
app.use(express.urlencoded({
    extended: true
}));

app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.session.isAuthenticated;
    res.locals.authUser = req.session.authUser;

    res.locals.isAdmin = req.session.isAdmin ? true : false;
   // console.log('Auth User:', res.locals.authUser);
    next();
});

app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home',
        activeNav: 'Home'
    });
});

app.use('/account', accountRouter);
app.use('/products', productRouter);

app.use('/admin/categories', adminCategoryRouter);
app.use('/admin/products', adminProductRouter);
app.use('/admin/users', adminUserRouter);
app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});