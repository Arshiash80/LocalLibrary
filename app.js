let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
var compression = require('compression');
var helmet = require('helmet');

const session = require('express-session')
const flash = require('connect-flash')

const passport = require('passport')

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let catalogRouter = require('./routes/catalog')

let app = express();

// Config passport.
require('./configs/passport')(passport)

// Config environment variables.
require('dotenv').config({ path: path.join(__dirname, '/configs/.env') })

// Set up mongoose connection
let mongoose = require('mongoose')
let mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URL // DB config
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }) // Connect to Mongo
  .then(() => console.log('MongoDB Conected...'))
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

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

// Passport middleware.
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  next()
})

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
