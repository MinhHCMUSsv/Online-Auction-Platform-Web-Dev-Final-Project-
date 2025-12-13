import express from 'express';
import { engine } from 'express-handlebars';
import hbs_helpers from 'handlebars-helpers';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import { isAuth, isAdmin } from './src/middlewares/auth.mdw.js';
import moment from 'moment';

import accountRouter from './src/routes/account.route.js';
import productRouter from './src/routes/product.route.js';
import sellerRouter from './src/routes/seller.route.js';

import adminCategoryRouter from './src/routes/admin-category.route.js';
import adminProductRouter from './src/routes/admin-product.route.js';
import adminUpgradeRouter from './src/routes/admin-upgrade.route.js';

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
        formatDate: function (date, format) {
            return moment(date).format(format);
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
app.use('/seller', sellerRouter);

app.use('/admin/categories', adminCategoryRouter);
app.use('/admin/products', adminProductRouter);
app.use('/admin/upgrade-requests', adminUpgradeRouter);

app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});