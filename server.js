// Example request: http://localhost:8000/movie?genre=Animation

// Example request: http://localhost:8000/movie?country=United States

// Example request: http://localhost:8000/movie?avg_vote=7

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

// require data file
const MOVIEDATA = require('./movies-data-small.json');

const app = express();

// change morgan logging setting to 'tiny' when hosted
const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));

app.use(helmet());
app.use(cors());

app.use(helmet.hidePoweredBy());

app.get('/', (req, res) => {
	res.send('Hello Express!');
});

// VALIDATION
app.use(function validateBearerToken(req, res, next) {
	const apiToken = process.env.API_TOKEN;
	const authToken = req.get('Authorization');

	if (!authToken || authToken.split(' ')[1] !== apiToken) {
		return res.status(401).json({ error: 'Unauthorized request' });
	}

	// move to the next middleware
	next();
});

function handleGetMovie(req, res) {
	// by default will return ALL movies
	let response = MOVIEDATA;

	const { genre = '', country = '', avg_vote = '', sort = '' } = req.query;

	// Users can search for Movies by genre, country or avg_vote

	// filter our movie by genre if genre query param is present
	if (genre) {
		response = response.filter(movie =>
			// case insensitive searching
			movie.genre.toLowerCase().includes(genre.toLowerCase())
		);
	}

	// filter our movie by country if country query param is present
	if (country) {
		response = response.filter(movie =>
			// case insensitive searching
			movie.country.toLowerCase().includes(country.toLowerCase())
		);
	}

	// filter our movie by avg_vote if avg_vote query param is present & avg_vote >= the supplied number
	if (avg_vote) {
		response = response.filter(
			movie =>
				// compare NUMBER
				Number(movie.avg_vote) >= Number(avg_vote)
		);
	}

	if (sort) {
		response.sort((a, b) => {
			return a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0;
		});
	}

	res.json(response);
}
app.get('/movie', handleGetMovie);

// ERROR HANDLING
// 4 parameters in middleware, express knows to treat this as error handler
app.use((error, req, res, next) => {
	let response;
	if (process.env.NODE_ENV === 'production') {
		response = { error: { message: 'server error' } };
	} else {
		response = { error };
	}
	res.status(500).json(response);
});

// get PORT number from Heroku when hosted; when local use PORT 8000
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {});
