var router = require('express').Router();
var mongoose = require('mongoose');
var Invoice = mongoose.model('Invoice');
var User = mongoose.model('User');
var auth = require('../auth');

// Preload invoice objects on routes with ':invoice'
router.param('invoice', function (req, res, next, number) {
  Invoice.findOne({ number: number })
    .then(function (invoice) {
      if (!invoice) { return res.sendStatus(404); }

      req.invoice = invoice;

      return next();
    }).catch(next);
});

// Return all invoices
router.get('/', auth.optional, function (req, res, next) {
  Invoice.find({}).then(function (invoices) {
    return res.json({ invoices: invoices });
  }).catch(next);
});

// Insert a invoice
router.post('/', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    var invoice = new Invoice(req.body.invoice);

    invoice.creator = user;
    invoice.newDatePayment = '';

    return invoice.save().then(function () {
      return res.json({ invoice: invoice.toJSONFor() });
    });
  }).catch(next);
});

// Return a invoice
router.get('/:invoice', auth.optional, function (req, res, next) {
  Promise.all([
    req.payload ? Invoice.findById({ _id: req.payload.id }) : null
  ]).then(function () {
    return res.json({ invoice: req.invoice.toJSONFor() });
  }).catch(next);
});

// Update invoice
router.put('/:invoice', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    Promise.all([
      req.payload ? Invoice.findById({ _id: req.payload.id }) : null
    ]).then(function () {

      if (typeof req.body.invoice.datePayment !== 'undefined') {
        req.invoice.datePayment = req.body.invoice.datePayment;
      }

      if (typeof req.body.invoice.status !== 'undefined') {
        req.invoice.status = req.body.invoice.status;
      }

      if (typeof req.body.invoice.newDatePayment !== 'undefined') {
        req.invoice.newDatePayment = new Date(req.body.invoice.newDatePayment);
      }

      if ((req.invoice.status === 2 || req.invoice.status === 3) && user.usertype != 2) {
        return res.sendStatus(401);
      } else {
        if (req.invoice.status == 2) {
          req.invoice.datePayment = req.body.invoice.newDatePayment;
        }
      }

      req.invoice.updateOne(req.invoice).then(function () {
        return res.sendStatus(200);
      });
    }).catch(next);

  });
});

module.exports = router;
