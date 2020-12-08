const Author = require("../models/author")
const Book = require("../models/book")
const { body, validationResult } = require("express-validator")

const mongoose = require('mongoose')
const async = require('async')

// Display list of all Authors.
exports.author_list = function(req, res, next) {

    Author.find()
        .sort([["family_name", "ascending"]])
        .exec(function(err, list_authors) {
            
            res.render("author_list", { title: "Authors List", error: err, author_list: list_authors })
        })
}

// Display detail page for specific Author.
exports.author_detail = function(req, res, next) {

    let id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        author: function(callback) {
            Author.findById(id)
                .exec(callback)
        },
        author_books: function(callback) {
            Book.find({ 'author': id }, 'title summary')
                .exec(callback)
        }
    }, function(err, results) {
            if (err) { return next(err) } // Error in API usage.
            if (results.author == null) { // No results.
                let err = new Error("Author not found.")
                err.status = 404
                return next(err)
            }
            // Succesful so render
            res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.author_books })          
    })
}

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    console.log(req.body)
    res.render('author_form', { title:"Create Author" })
}

// Handle Author create on POST.
exports.author_create_post = [

    // Validate and sanitise fieldss.
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),

    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Family name must be specified.')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters.'),

    body('date_of_birth', 'Invalid date of birth.')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    body('date_of_death', 'Invalid date of death.')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),   

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', { title:"Create Author", author: req.body, errors: errors.array() })
            return
        } else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            let author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            )

            author.save(function(err) {
                if (err) { return next(err) }
                // Successful - Redirect to new author record.
                res.redirect(author.url)
            })
        }
    }
]

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find( { 'author': req.params.id } ).exec(callback)
        }
    }, function(err, results) {
        if  (err) { return next(err) }
        if (results.author == null) { 
            // No results.
            res.redirect('/catalog/authors')
         }
        //  Successful, so render.
        res.render('author_delete', { title: 'Delete Author', author: results.author, authors_books: results.authors_books })
    })
}

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
            Book.find( { 'author': req.body.authorid } ).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err) }
        // Success
        if (results.authors_books.length> 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', auhtor: results.author, authors_books: results.authors_books })
            return
        } else {
            // Auhtor has no books. Delete object and redirect to the list of objects.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err) }
                // Success, go to authors list.
                res.redirect('/catalog/authors')
            })
        }
    })
}

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send("NOT IMPLEMENTED: Auhtor update on GET: " + req.params.id)
}

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send("NOT IMPLEMENTED: Author update POST")
}