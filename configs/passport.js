const LocalStrategy = require('passport-local').Strategy 
const bcrypt = require('bcryptjs')

// Loadn User model.
const User = require('../models/user')

module.exports = function(passport) {
    passport.use(new LocalStrategy({usernameField: 'user_email', passwordField: 'user_password'}, function(user_email, user_password, done) {
        console.log("Data user_email: ", user_email)
        console.log("Data user_password: ", user_password)
        User.findOne({ user_email: user_email }, function(err, user) {
          if (err) { return done(err); }
          if (!user) {
            return done(null, false, { message: 'Incorrect email adress!' });
          } else {
            bcrypt.compare(user_password, user.user_password, (err, isMatch) => {
              if (err) { done(err) }
    
              if (isMatch) {
                return done(null, user)
              } else {      
                return done(null, false, { message: "Incorrect password!" })          
              }    
          })
            
          }
          
        });
      }
    ));
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
}

