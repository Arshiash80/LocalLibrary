var express = require('express');
var router = express.Router();

const { body, validationResult, check } = require("express-validator")
const async = require('async')

const passport = require('passport')

var bcrypt = require('bcryptjs');

// Init User model.
const User = require('../models/user')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('GET users listing.');
  // TODO: Add all users list page.
});

// Display user register form.
router.get('/register', function(req, res, next) {
  res.render('user_register', { title:"Register form:" })
})

// Handle user register form.
router.post('/register', [
  
  // Validate and sanitise fieldss.
  body('user_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('User name must be specified.')
    .isAlphanumeric()
    .withMessage('User name has non-alphanumeric characters.'),

  body('user_email')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Email must be specified.')
    .isEmail()
    .withMessage('Enter a valid email.'),

  body('user_password')
    .trim()
    .isLength({ min: 4 })
    .withMessage('password must be at least 4 characters')
    .escape(),

  body('user_password2')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Password required.')
    .custom((value,{req, loc, path}) => { // Check's if password2 is iqual to password.
      if (value !== req.body.user_password) {
          // trow error if passwords do not match
          throw new Error("Passwords don't match");
      } else {
          return value;
      }
  }),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('user_register', { title:"Register form:", user: req.body, errors: errors.array() })
      return
    } else {
      // There is no error.
      // Data from form is valid.

      bcrypt.genSalt(10, function(err, salt) {
        if(err) { return next(err) }
        bcrypt.hash(req.body.user_password, salt, function(err, hash) {
          if(err) { return next(err) }
          // Store hash in your password DB.
          let new_user = new User({
            user_name: req.body.user_name,
            user_email: req.body.user_email,
            user_password: hash
          })
          // Check the user is exists.
          User.findOne({ user_email: req.body.user_email })
          .then(user => {
            console.log(user)
            if (user) {
              res.render('user_register', { title:"Register form:", user: req.body, errors: [{ msg:`A user with ${req.body.user_email} email adress is exists.` }] })
            } else {
              // User not exists. So save the new user

              new_user.save(function(err) {
                if (err) { next(err) }
                // Successful - Redirect to login form.
                req.flash('success_msg', 'Youre registration complete successfully! You can now login.')
                res.redirect('/users/login')
              })
            }
          })
        });
      });
    
    }
  } 
])

// Display user login form.
router.get('/login', function(req, res, next) {
  res.render('user_login', { title:"Login form:" })
})

// Handle user login form.
router.post('/login', [

  // Validate and sanitise fieldss.
  body('user_email')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Email must be specified.')
    .isEmail()
    .withMessage('Enter a valid email.'),

  body('user_password')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Password must be specified.')
    .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('user_login', { title:"Login form:", user: req.body, errors: errors.array() })
    }


    passport.authenticate('local', { 
      successRedirect: '/catalog',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next)

  }
])

// Handle logout
router.get('/logout', (req, res, next) => {
  req.logout();
  req.flash('success_msg', "You are logged out.")
  res.redirect('/users/login')
})

module.exports = router;
