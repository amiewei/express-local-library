const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const async = require("async");

// Display list of all BookInstances.
// populate() - Whenever in the schema of one collection we provide a reference (in any field) to a document from any other collection, we need a populate() method to fill the field with that document.
//BookInstanceSchema has "book" that needs to be populated so you get details of the book, rather than just a reference to the book
exports.bookinstance_list = (req, res) => {
  BookInstance.find()
    .sort([['status', 'asc']])
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }

      res.render("bookinstance_list", { 
        title: "Book Instance List", 
        bookinstance_list: list_bookinstances
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res) => {
  BookInstance.findById(req.params.id)
  .populate("book")
  .exec((err, bookinstance) => {
    if (err) {
      return next(err);
    }
    if (bookinstance == null) {
      // No results.
      const err = new Error("Book copy not found");
      err.status = 404;
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_detail", {
      title: `Copy: ${bookinstance.book.title}`,
      bookinstance,
    });
  });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    console.log('book instance create - books:')
    console.log(books)

    //books is a drop down of all the books available to make copies
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  console.log(req.params.id)
  async.waterfall(
    [
     book_instances = (callback) => {
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(callback);
      },
    ],
    (err, results) => {
      if (err) {
        return next(err);
      }
      console.log(results)
      if (results._id == null) {
        // No results.
        console.log('no results')
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        book_instances: results,
      });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  async.waterfall(
    [
     book_instances = (callback) => {
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(callback);
      },
    ],
    (err, results) => {

      if (err) {
        return next(err);
      }
      console.log(results)
      if (results._id == null) {
        // No results.
        console.log('no results')
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) {
          return next(err);
        }
        // Success - go to genre list
        res.redirect("/catalog/bookinstances");
      }
    );
    }
  )
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {

  async.waterfall(
    [
     book_instances = (callback) => {
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(callback);
      },
    ],
    (err, results) => {
      console.log(results)
      if (err) {
        return next(err);
      }
      if (results._id == null) {
        // No results.
        console.log('no results')
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      res.render("bookinstance_form", {
        title: "Update Book Instance",
        booktitle: results.book.title,
        bookinstance: results
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

  (req, res, next) => {
    console.log('book instance POST')
    next();
  },

  body("book", "Book must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status")
    .escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    console.log(req.body.book)
    if (!errors.isEmpty()) {
      console.log('error detected')
          // Successful, so render.
        res.render("bookinstance_form", {
          title: "Update Book Instance",
          booktitle: req.body.book,
          bookinstance: req.body,
          errors: errors.array(),
        });
    };

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    BookInstance.findByIdAndUpdate(
      req.params.id, 
      bookinstance, 
      //can name theauthor anything here, it's just the results
      function (err, thebookinstance) {
        if (err) {
          return next(err);
        }
        console.log('redirecting', thebookinstance)
        // Successful - redirect to new author record.
        res.redirect(thebookinstance.url);
      });
  },
];
