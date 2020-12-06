let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
var compression = require('compression');
var helmet = require('helmet');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let catalogRouter = require('./routes/catalog')

let app = express();

// Config environment variables.
require('dotenv').config({ path: path.join(__dirname, '/configs/.env') })

// Set up mongoose connection
let mongoose = require('mongoose')
let mongoDB = process.env.DATABASE_URL
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
let db = mongoose.connection
// __Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error: '))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(compression()); //Compress all routes
app.use(helmet());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
