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
const { render } = require('ejs');
var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/', (req, result) => {
    result.redirect('/login')
});

app.get('/login', (req, result) => {
    result.render('pages/landing')
});

app.post('/home', async (req, result) => {
    
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, login
            result.render('pages/home', { email: req.body.email, password: req.body.password })
        }
    });
});

app.get('/signUp', (req, result) => {
    result.render('pages/signUp')
});

app.get('/errors', (req, result) => {
    result.render('pages/errors', { errmsg: req.query.errmsg })
});

app.post('/verifyCreds', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}'`, (err, res) => {
        if (err) {
            result.render('pages/errors', { errmsg: err.message });
        }
        else if (res.rowCount == 0) {
            result.render('pages/errors', { errmsg: "no account associated with provided username and password." });
        }
        else {
            //change users signed in variable to true
            pool.query(`UPDATE Public.user
                        SET is_signed_in = True
                        WHERE email='${req.body.email}'`, (err, res2) => {
                if (err) {
                    result.render('pages/errors', { errmsg: err.message });
                }
                else {
                    //success, login
                    result.render('pages/home', { email: res.rows[0].email, password: res.rows[0].password });
                }
            });
        }
    });
});

app.post('/signout', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=true`, (err, res) => {
        if (err) {
            console.log(err);
            result.render('pages/errors', { errmsg: err.message });
        }
        else if (res.rowCount == 0) {
            result.render('pages/errors', { errmsg: "no account associated with provided username and password." });
        }
        else {
            //change users signed in variable to false
            pool.query(`UPDATE Public.user
                        SET is_signed_in = False
                        WHERE email='${req.body.email}'`, (err, res2) => {
                if (err) {
                    console.log(err);
                    result.render('pages/errors', { errmsg: err.message });
                }
                else {
                    //success, signout user
                    result.setHeader('Clear-Site-Data', '"*"');
                    result.render('pages/landing');
                }
            });
        }
    });
});

app.post('/createUser', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'`, (err, res) => {
        if (err) {
            console.log(err);
            result.render('pages/errors', { errmsg: err.message });
        }
        else if (res.rowCount > 0) {
            result.render('pages/errors', { errmsg: "username already in use." });
        }
        else {
            pool.query(`INSERT INTO public.User (email, password,
                first_name, last_name, is_signed_in) VALUES (
                '${req.body.email}', '${req.body.password}',
                '${req.body.first_name}',
                '${req.body.last_name}',
                True)`, (err, res) => {

                if (err) {
                    console.log(err);
                    result.render('pages/errors', { errmsg: err.message });
                }
                else {
                    console.log("user created");
                    //success, login
                    result.render('pages/home', { email: `${req.body.email}`, password: `${req.body.password}` });
                }
            })
        }
    });
});

app.post('/allBooks', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            pool.query(`SELECT *, ('${req.body.email}'
                                    IN (SELECT usr_email FROM favorite
                                    WHERE book.book_id = favorite.book_id))
                                    AS is_favorite,
                                    (SELECT COUNT(book_id) FROM favorite
                                    WHERE book.book_id=favorite.book_id)
                                    AS favorite_count FROM book ORDER BY title`, (err, res) => {

                result.render('pages/allBooks', { books: res.rows, email: req.body.email, password: req.body.password });
            })
        }
    });
});

app.post('/book', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            pool.query(`SELECT * FROM book JOIN author
                                    ON author.author_id = book.author_id
                                    WHERE book_id=${req.body.book_id}`, (err, res) => {
                
                if (err) {console.log(err);}
                result.render('pages/book', { book: res.rows[0], email: req.body.email, password: req.body.password });
            })
        }
    });
});

app.post('/search', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            result.render('pages/search', { email: req.body.email, password: req.body.password });
        }
    });
});

app.post('/searchResults', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access

            //build book search sql string
            let sqlString = `SELECT *, ('${req.body.email}'
                            IN (SELECT usr_email FROM favorite
                            WHERE book.book_id = favorite.book_id))
                            AS is_favorite,
                            (SELECT COUNT(book_id) FROM favorite
                            WHERE book.book_id=favorite.book_id)
                            AS favorite_count FROM book
                            JOIN author ON author.author_id = book.author_id
                            WHERE LOWER(title) LIKE LOWER('%${req.body.title}%')
                            AND LOWER(publisher) LIKE LOWER('%${req.body.publisher}%')
                            AND LOWER(full_name) LIKE LOWER('%${req.body.author}%')`;

            if (req.body.book_id != "") {
                sqlString += ` AND book_id = ${req.body.book_id}`;
            }

            if (req.body.rating != "") {
                sqlString += ` AND rating >= ${req.body.rating}`;
            }

            if (req.body.year_published != "") {
                sqlString += ` AND year_published = ${req.body.year_published}`;
            }

            sqlString += ` ORDER BY title`;

            pool.query(sqlString, (err, res) => {
                if(err){ console.log(err);}
                result.render('pages/searchResults', { books: res.rows, email: req.body.email, password: req.body.password });
            })
        }
    });
});

app.post('/addFavorite', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            pool.query(`SELECT COUNT(book_id) FROM favorite
                        WHERE usr_email='${req.body.email}'
                        AND book_id=${req.body.book_id}`, (err, res) => {
                
                if (err) {
                    result.render('pages/errors', { errmsg: err })
                }
                else if (res.rows[0].count > 0) {
                    //delete from favorites table
                    pool.query(`DELETE FROM favorite WHERE
                                usr_email='${req.body.email}'
                                AND book_id=${req.body.book_id}`, (err, res) => {
                        
                        if (err) {
                            result.render('pages/errors', { errmsg: err })
                        }
                        else {
                            //build "find all my favorites" slq string
                            let sqlString = `SELECT title, book_id, is_favorite,
                                            favorite_count FROM (SELECT *, ('${req.body.email}'
                                            IN (SELECT usr_email FROM favorite
                                            WHERE book.book_id = favorite.book_id))
                                            AS is_favorite,
                                            (SELECT COUNT(book_id) FROM favorite
                                            WHERE book.book_id=favorite.book_id)
                                            AS favorite_count FROM (book
                                            JOIN author ON author.author_id = book.author_id)) AS tempTable
                                            WHERE is_favorite=true
                                            ORDER BY title`;

                                pool.query(sqlString, (err, res) => {
                                if(err){ console.log(err);}
                                else {
                                    result.render('pages/favorites', { books: res.rows, email: req.body.email, password: req.body.password });
                                }
                            })
                        }
                    })
                }
                else {
                    //add to favorites table
                    pool.query(`INSERT INTO favorite (usr_email, book_id)
                                VALUES ('${req.body.email}', ${req.body.book_id})`, (err, res) => {
                        
                        if (err) {
                            console.log(err);
                            result.render('pages/errors', { errmsg: err })
                        }
                        else {
                            //build "find all my favorites" slq string
                            let sqlString = `SELECT title, book_id, is_favorite,
                                            favorite_count FROM (SELECT *, ('${req.body.email}'
                                            IN (SELECT usr_email FROM favorite
                                            WHERE book.book_id = favorite.book_id))
                                            AS is_favorite,
                                            (SELECT COUNT(book_id) FROM favorite
                                            WHERE book.book_id=favorite.book_id)
                                            AS favorite_count FROM (book
                                            JOIN author ON author.author_id = book.author_id)) AS tempTable
                                            WHERE is_favorite=true
                                            ORDER BY title`;

                                pool.query(sqlString, (err, res) => {
                                if(err){ console.log(err);}
                                else {
                                    result.render('pages/favorites', { books: res.rows, email: req.body.email, password: req.body.password });
                                }
                            })
                        }
                    })
                }
            })
        }
    });
});

app.post('/favorites', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access

            //build "find all my favorites" slq string
            let sqlString = `SELECT title, book_id, is_favorite,
                            favorite_count FROM (SELECT *, ('${req.body.email}'
                            IN (SELECT usr_email FROM favorite
                            WHERE book.book_id = favorite.book_id))
                            AS is_favorite,
                            (SELECT COUNT(book_id) FROM favorite
                            WHERE book.book_id=favorite.book_id)
                            AS favorite_count FROM (book
                            JOIN author ON author.author_id = book.author_id)) AS tempTable
                            WHERE is_favorite=true
                            ORDER BY title`;

            pool.query(sqlString, (err, res) => {
                if(err){ console.log(err);}
                else {
                    result.render('pages/favorites', { books: res.rows, email: req.body.email, password: req.body.password });
                }
            })
        }
    });
});

app.post('/admin', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True
                AND role='admin'`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed. Note: only admins can use the admin functionality." })
        }
        else {
            //success, allow access
            pool.query(`SELECT *, ('${req.body.email}'
                        IN (SELECT usr_email FROM favorite
                        WHERE book.book_id = favorite.book_id))
                        AS is_favorite,
                        (SELECT COUNT(book_id) FROM favorite
                        WHERE book.book_id=favorite.book_id)
                        AS favorite_count FROM book ORDER BY title`, (err, res) => {

            result.render('pages/admin', { books: res.rows, email: req.body.email, password: req.body.password });
            })
        }
    });
});

app.post('/bookEdit', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            pool.query(`SELECT * FROM book
                        WHERE book_id=${req.body.book_id}`, (err, res) => {
                
                if (err) {console.log(err);}
                result.render('pages/bookEdit', { book: res.rows[0], email: req.body.email, password: req.body.password });
            })
        }
    });
});

app.post('/bookEditSubmit', (req, result) => {
    pool.query(`SELECT * FROM public.User WHERE email='${req.body.email}'
                AND password='${req.body.password}' AND is_signed_in=True`, (err, res) => {
        if (err) {
            console.log(err)
            result.render('pages/errors', { errmsg: err })
        }
        else if (res.rowCount == 0) {
            console.log("no account associated with provided username and password.")
            result.render('pages/errors', { errmsg: "credential verification failed" })
        }
        else {
            //success, allow access
            pool.query(`UPDATE book
                        SET title='${req.body.title}',
                            publisher='${req.body.publisher}',
                            rating=${req.body.rating},
                            year_published=${req.body.year_published}
                            WHERE book_id=${req.body.book_id}`, (err, res) => {
                
                if (err) {
                    console.log(err);
                    result.render('pages/errors', { errmsg: err })
                }
                else {
                    pool.query(`SELECT *, ('${req.body.email}'
                        IN (SELECT usr_email FROM favorite
                        WHERE book.book_id = favorite.book_id))
                        AS is_favorite,
                        (SELECT COUNT(book_id) FROM favorite
                        WHERE book.book_id=favorite.book_id)
                        AS favorite_count FROM book ORDER BY title`, (err, res) => {

                    result.render('pages/admin', { books: res.rows, email: req.body.email, password: req.body.password });
                    });
                }
            })
        }
    });
});


app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running.. on Port 3000');
});