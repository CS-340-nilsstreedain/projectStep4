const express = require('express');
const exphbs = require('express-handlebars');
var db = require('./db-connector')

const PORT = process.env.PORT || 6784;
const pages = [
	{title: 'Home', url: '/'},
	{title: 'Customers', url: '/customers'},
	{title: 'Orders', url: '/orders'},
	{title: 'OrderBooks', url: '/orderbooks'},
	{title: 'Books', url: '/books'},
	{title: 'BookGenres', url: '/bookgenres'},
	{title: 'Genres', url: '/genres'}
];

// Create an Express app
const app = express();

// Register custom helper for equality comparison
const hbs = exphbs.create({});
hbs.handlebars.registerHelper('isEqual', function (a, b, options) {
	return a === b ? options.fn(this) : options.inverse(this);
});

hbs.handlebars.registerHelper('isNotEqual', function (a, b, options) {
	return a !== b ? options.fn(this) : options.inverse(this);
});

// Configure express-handlebars
app.engine('hbs', exphbs.engine({extname: '.hbs'}));
app.set('view engine', 'hbs');

app.use(express.json());

app.use(express.static('public'));

// Create routes for each page
pages.forEach(({title, url}) => {
	if (title == 'Home') {
		app.get(url, (req, res) => {
			res.render('home', {
				title: title,
				pages
			});
		});
	} else {
		app.get(url, (req, res) => {
			db.pool.query('SELECT * FROM ' + title, (error, results) => {
				if (error) throw error;
				
				res.render('table', {
					title: title,
					data: results,
					pages
				});
			});
		});
	}
	
	// CREATE
	app.post(url + '/create', (req, res) => {
		// Construct keys and values arrays
		const keys = Object.keys(req.body);
		const values = Object.values(req.body);

		// Build SQL statement
		const sql = `INSERT INTO ${title} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;

		// Execute the query
		db.pool.query(sql, values, (error, results) => {
			if (error) throw error;
			res.redirect(url);
		});
	});

	// UPDATE
	app.post(url + '/update/:id', (req, res) => {
		const sql = 'UPDATE ' + title + ' SET ? WHERE id = ?';
		db.pool.query(sql, [req.body, req.params.id], (error, results) => {
			if (error) throw error;
			res.redirect(url);
		});
	});

	// DELETE
	app.post(url + '/delete/:id', (req, res) => {
		const sql = 'DELETE FROM ' + title + ' WHERE id = ?';
		db.pool.query(sql, req.params.id, (error, results) => {
			if (error) throw error;
			res.redirect(url);
		});
	});
});

app.listen(PORT, function (err) {
	if(err) throw err;
    console.log(`Server running on port ${PORT}`);
});
