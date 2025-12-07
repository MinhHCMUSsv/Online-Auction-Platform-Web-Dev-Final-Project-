import express from 'express';
import { engine } from 'express-handlebars';
import hbs_helpers from 'handlebars-helpers';

import accountRouter from './src/routes/account.route.js';
import productRouter from './src/routes/product.route.js';

const app = express();
const PORT = process.env.PORT || 3000;
const helpers = hbs_helpers();

app.engine('handlebars', engine({ helpers: helpers }));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home',
        activeNav: 'Home'
    });
});

app.use(express.urlencoded({
    extended: true
}));

app.use('/accounts', accountRouter);
app.use('/products', productRouter);



app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});