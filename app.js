import express from 'express';
import { engine } from 'express-handlebars';
import hbs_helpers from 'handlebars-helpers';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import { isAuth, isAdmin, isUpgradePending } from './src/middlewares/auth.mdw.js';
import moment from 'moment';

import authRouter from './src/routes/accountRoute/auth.route.js';
import sellerRouter from './src/routes/seller.route.js';

import adminCategoryRouter from './src/routes/adminRoute/category.route.js';
import adminProductRouter from './src/routes/adminRoute/product.route.js';
import adminUserRouter from './src/routes/adminRoute/user.route.js';

import passport from './src/utils/passport.js';

import commonRouter from './src/routes/accountRoute/common.route.js';
import profileRouter from './src/routes/accountRoute/profile.route.js';
import menuRouter from './src/routes/accountRoute/menu.route.js';

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
        },
        formatAuctionTime: function (date, format) {
            const dateObj = moment(date);
            const now = moment();

            if (!dateObj.isValid()) return '';
            // Tính khoảng cách (đơn vị ngày)
            const diffDays = dateObj.diff(now, 'days', true);
            // A. ĐÃ HẾT HẠN (Quá khứ)
            if (diffDays < 0) {
                return "Ended"; 
            }
            // B. SẮP HẾT HẠN (Dưới 3 ngày) -> Hiện in 2 hours, in a day...
            if (diffDays >= 0 && diffDays < 3) {
                return dateObj.fromNow(); 
            }
            // C. CÒN LÂU (Trên 3 ngày) -> Hiện ngày tháng cụ thể
            return dateObj.format(format);
        },

        formatCurrency: function (value) {
            if (isNaN(value)) return value;
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value).replace(/\.00$/, '');
        },

        ifEquals (a, b, options) {
            return (a === b) ? options.fn(this) : options.inverse(this);
        },

        add (a, b) {
            return a + b;
        }

    }
     
}));

app.set('view engine', 'handlebars');
app.set('views', './src/views');

app.use('/src/static', express.static('src/static'));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.session.isAuthenticated;
    res.locals.authUser = req.session.authUser;

    res.locals.fatherCategories = req.session.fatherCategories || [];
    next();
});

app.use(isUpgradePending);

app.use('/', commonRouter);
app.use('/menu', menuRouter);
app.use('/auth', authRouter);

app.use('/profile', isAuth, profileRouter);

app.use('/seller', sellerRouter);

app.use('/admin/categories', adminCategoryRouter);
app.use('/admin/products', adminProductRouter);
app.use('/admin/users', adminUserRouter);

app.use((req, res) => {
    res.status(403).render('vwError/403');
});

app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});