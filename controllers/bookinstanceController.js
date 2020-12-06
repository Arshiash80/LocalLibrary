const BookInstance = require('../models/bookinstance')
const Book = require('../models/book')

const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const async = require('async')
const { render } = require('pug')

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {

    // Return all bookinstance objects.
    BookInstance.find()
        .populate('book') // this will replace the book id stored for each BookInstance with a full Book document.
        .exec(function(err, list_bookinstances) {
            res.render('bookinstance_list', { title: 'Book Instance List', error: err, bookinstance_list: list_bookinstances })
        })
}

// Display detail page for specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    
    let id = mongoose.Types.ObjectId(req.params.id)
    BookInstance.findById(id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err) }
            if (bookinstance == null ) {
                let err = new Error("Book copy not found.")
                err.status = 404
                return next(err)
            }
            // Succesfull, so render
            res.render("bookinstance_detail", { title: `Copy: ${bookinstance.book.title}`, bookinstance: bookinstance })
        })
}

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({}, 'title')
        .exec(function(err, books) {
            if (err) { return next(err) }
            // Successful, so render.
            res.render('bookinstance_form', { title:"Create BookInstance (copy)", book_list: books })
        })
}

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min:1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min:1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract a validation errors from a request
        const errors = validationResult(req)

        // Create a BookInstance object with escaped and trimmed data.
        let bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        )

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: "Create BookInstance (copy)", book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        } else {
            // Data from form is valid.
            bookinstance.save(function(err) {
                if (err) { return next(err) }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url)
            })
        }
    }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    
    BookInstance.findById(req.params.id).exec(function(err, bookinstance) {
        if (err) { next(err) }
        if (bookinstance == null) {
            // No results. redirect to bookinstances list.
            res.redirect('/catalog/bookinstances')
            return
        }
        // Success. So render.
        res.render('bookinstance_delete', { title: "Delete BookInstance", bookinstance: bookinstance })
    })
}

// Handle BookInstace delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function bookinstanceDelete(err) {
        if (err) { next(err) }
        // Success, go to bookinstances list.
        res.redirect('/catalog/bookinstances')
    })
}

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET')
}

// Handle BookInstance update on POST.
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST')
}