import express from 'express';
import { engine } from 'express-handlebars';

import accountRouter from './src/routes/account.route.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './src/views');

app.get('/', (req, res) => {
    res.render('home');
});

app.use(express.urlencoded({
    extended: true
}));

app.use('/accounts', accountRouter);

app.listen(PORT, function() {
    console.log('Server is running on http://localhost:' + PORT);
});