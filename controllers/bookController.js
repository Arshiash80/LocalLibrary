const Book = require('../models/book')
const Author = require('../models/author')
const Genre = require('../models/genre')
const BookInstance = require('../models/bookinstance')
const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator')

const async = require('async')
// Display home page.
exports.index = function(req, res) {
    // These functions are all started at the same time.
    // When all of them have completed the final callback 
    // is invoked with the counts in the results parameter (or an error).
    async.parallel(
        {
            book_count: function(callback) {
                Book.countDocuments({}, callback)
            },
            book_instance_count: function(callback) {
                BookInstance.countDocuments({}, callback)
            },
            book_instance_available_count: function(callback) {
                BookInstance.countDocuments({ status: 'Available' }, callback)
            },
            author_count: function(callback) {
                Author.countDocuments({}, callback)
            },
            genre_count: function(callback) {
                Genre.countDocuments({}, callback)
            }
        }, function(err, results) {
            res.render('index', { title: 'Local Library Home', error: err, data: results, name: req.user.user_name })
            // The data is supplied as key-value pairs, and can be accessed in the template using the key.
        }
    )    
};

// Display list of all books.
exports.book_list = function(req, res, next) {

    Book.find({}, 'title author')
        .populate('author') // this will replace the stored book author id with the full author details.
        .exec(function(err, list_books) {
            if (err) { return next(err) }
            // Successfull, so render
            res.render('book_list', { title: 'Book List', error: err, book_list: list_books })
        })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    let id = mongoose.Types.ObjectId(req.params.id); // for error handling pupose. (Not a big deal)
    async.parallel({
        book: function(callback) {
            Book.findById(id)
                .populate('author')
                .populate("genre")
                .exec(callback)
        },
        book_instance: function(callback) {

            BookInstance.find({ 'book': id })
                .exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.book == null) { // no results.
            let err =  new Error('Book not found.')
            err.status = 404
            return next(err)
        }
        // Successful, so render
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance })
    })
    
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback)
        },
        genres: function(callback) {
            Genre.find(callback)
        }
    }, function(err, results) {
        // console.log(results)
        if (err) { return next(err) }
        res.render('book_form', { title: "Create Book", authors: results.authors, genres: results.genres })
    })
};

// Handle book create on POST.
exports.book_create_post = [

    // Convert the genre to an array.
    (req, res, next) => {

        if(!(req.body.genre instanceof Array)) {
            if (req.body.genre) {
                if(typeof req.body.genre === 'undefiend') {
                    req.body.genre = []
                } else {
                    req.body.genre = new Array(req.body.genre)
                }   
            }  
        }
        next()
    },

    // Validate an sanitise fields.
    body('title', 'Title must notbe empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must notbe empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must notbe empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must notbe empty.').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req)

        // Create a Book object with escaped and trimmed data.
        let data = req.body
        let book = new Book(
            {
                title: data.title,
                author: data.author,
                summary: data.summary,
                isbn: data.isbn,
                genre: data.genre
            }
        )

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback)
                },
                genres: function(callback) {
                    Genre.find(callback)
                }
            }, function(err, results) {
                if (err) { return next(err) }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if(book.genre.indexOf(results.genres[i].__id) > -1) {
                        results.genres[i].checked = 'true'
                    }
                }
                res.render('book_form', { title: 'Create Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() })
            })
        } else {
             // Data from form is valid. Save book.
             book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
]

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    
    async.parallel({

        book: function(callback) {
            Book.findById(req.params.id).populate('author').exec(callback)
        },

        book_instances: function(callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.book == null) {
            // No books.
            res.redirect('/catalog/books')
        }
        // Success, so render.
        res.render('book_delete', { title: "Book Delete", book: results.book, book_instances: results.book_instances })
    })
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    console.log("Here!")
    console.log(req.body.bookid)
    async.parallel({

        book: function(callback) {
            Book.findById(req.body.bookid).populate('author').exec(callback)
        },

        book_instances: function(callback) {
            BookInstance.find({ 'book': req.body.bookid }).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        // Success.
        if (results.book_instances > 0) {
            // Book has BookInstances. Render in same way as for GET route.
            res.render('book_delete', { title: "Book Delete", book: results.book, book_instances: results.book_instances })     
            return
        } else {
            // Book has no BookInstances. Delete object and redirect to the list of objects.
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err) }
                // Success. Go to Books list.
                res.redirect('/catalog/books')
            })
        }
    })
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    
    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        authors: function(callback) {
            Author.find().exec(callback)
        },
        genres: function(callback) {
            Genre.find().exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.book == null) { 
            // No results. 
            let err = new Error("Book not found!")
            err.status = 404
            return next(err)
        }
        // Successfull.
        // Mark our selected genres as checked.
        for (let all_g_i = 0; all_g_i < results.genres.length; all_g_i++) {
            for (let book_g_i = 0; book_g_i < results.book.genre.length; book_g_i++) {
                if (results.genres[all_g_i].toString() === results.book.genre[book_g_i].toString()) {
                    results.genres[all_g_i].checked = 'true';
                }
            } 
        }
        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    })
};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },

    // Validate and sanitise fields.
    body('title', "Title must not be empty").trim().isLength({ min: 1 }).escape(),
    body('author', "Author must not be empty").trim().isLength({ min: 1 }).escape(),
    body('summary', "Summary must not be empty").trim().isLength({ min: 1 }).escape(),
    body('isbn', "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extarct validation errors from request.
        const errors = validationResult(req)

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
            { title: req.body.title,
              author: req.body.author,
              summary: req.body.summary,
              isbn: req.body.isbn,
              genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
              _id:req.params.id //This is required, or a new ID will be assigned!
             });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
    
]