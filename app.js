import express from 'express';
import { engine } from 'express-handlebars';
import hbs_helpers from 'handlebars-helpers';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import moment from 'moment';

import accountRouter from './src/routes/account.route.js';
import productRouter from './src/routes/product.route.js';
import sellerRouter from './src/routes/seller.route.js';

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

app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});