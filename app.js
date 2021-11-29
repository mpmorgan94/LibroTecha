const { Pool } = require('pg');

const pool = new Pool({
    user: 'ksyuhrlryqjvwf',
    host: 'ec2-3-230-199-240.compute-1.amazonaws.com',
    database: 'ddohuamgvd3gvn',
    password: '0ca289ad09ae24e49d4c36d293ae985f6feb36272251c55435cee119aa5fd65a',
    port: 5432,
    ssl: true
});


var bodyParser = require('body-parser');
var express = require('express');
const { body,validationResult } = require('express-validator');
var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('port', 7238);

app.get('/', (req, result) => {
    result.redirect('/login')
});

app.get('/login', (req, result) => {
    result.render('pages/landing')
});

app.get('/home', (req, result) => {
    result.render('pages/home')
});

app.get('/signUp', (req, result) => {
    result.render('pages/signUp')
});

app.post('/createUser', (req, result) => {
    console.log(req.body)

    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'`, (err, res) => {
        if (err) {
            console.log(err);
            result.redirect('/signUp')
        }
        else if (res.rowCount > 0) {
            result.render('pages/errors', { errmsg: "username already in use." });
        }
        else {
            pool.query(`INSERT INTO public.User (email, password,
                first_name, last_name) VALUES (
                '${req.body.email}', '${req.body.password}',
                '${req.body.first_name}',
                '${req.body.last_name}')`, (err, res) => {

            if (err) {
                console.log(err);
                result.redirect('/signUp')
            }
            else {
                result.redirect('/home');
            }
            })
        }
    });
});

app.get('/allBooks', (req, result) => {
    let books = pool.query('SELECT * FROM book', (err, res) => {
        //console.log(err, res.rows)
        result.render('pages/allBooks', { books: res.rows })
    })
});

app.listen(7238, () => {
    console.log('Server is running.. on Port 7238');
});