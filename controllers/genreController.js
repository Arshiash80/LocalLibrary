const Genre = require('../models/genre');
var mongoose = require('mongoose');
const { body, validationResult } = require("express-validator")
// validator = require("express-validator");
// body = validator.body();
// validationResult = validator.validationResult();

const Book = require('../models/book')
const async = require("async")

// Display list of all Genre.
exports.genre_list = function(req, res) {
    
    Genre.find()
    .sort([["name", "ascending"]])
    .exec(function(err, list_genre) {
        res.render('genre_list', { title: "Genre List", err: err, genre_list: list_genre })
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    let id = mongoose.Types.ObjectId(req.params.id); // for error handling pupose. (Not a big deal)
    async.parallel({
        genre: function(callback) {
            Genre.findById(id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
    
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {

    res.render('genre_form', { title: 'Create Genre' });
    
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate and santise the name field.
    body('name', 'Genre name min length is 3').trim().isLength({ min: 3 }).escape(),

    // Process request after validation/santise.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req)

        // Create a genre objecct with escaped and trimmed data.
        let genre = new Genre(
            {
                name: req.body.name
            }
        )

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: "Create Genre", genre: genre, errors: errors.array() })
            return
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, found_genre) {
                    if (err) { return next(err); }  
                    if (found_genre) { 
                        // Genre exists, redirect to its detail page.
                        res.redirect(found_genre.url);
                    }
                    else {
                        // Genre not exists. Create the genre
                        genre.save(function (err) {
                            if (err) { return next(err); }
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        });
                    }     
            });
        }
    }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.genre == null) {
            // No results.
            res.redirect('/catalog/genres')
        }
        // Successful. So render.
        res.render('genre_delete', { title: "Delete Genre", genre: results.genre, genres_books: results.genres_books })
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    console.log(req.body)
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({ 'genre': req.body.genreid }).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.genres_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genres_books: results.genres_books })
            return
        } else {
            // Genre has no books. Delete object and redirect to the list of objects.
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err) }
                // Success. Go to Genres list.
                res.redirect('/catalog/genres')
            })


        }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};