var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var InvoiceSchema = new mongoose.Schema({
  number: { type: Number, unique: true, index: true },
  description: { type: String, required: [true, "Can't be blank"] },
  dateBilling: { type: Date, required: [true, "Can't be blank"] },
  datePayment: { type: Date, default: ''},
  newDatePayment: Date,
  status: { type: Number, default: 0 },
  anticipation: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

InvoiceSchema.plugin(uniqueValidator, { message: 'Is already taken' });

// Auto Increment for Invoice Number
var CounterSchema = mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
var counter = mongoose.model('counter', CounterSchema);

InvoiceSchema.pre('save', function (next) {
  var invoice = this;

  if (invoice.number === undefined) {
    counter.findByIdAndUpdate({ _id: 'entityId' }, { $inc: { seq: 1 } }, { new: true, upsert: true }).then(function (count) {
      invoice.number = count.seq;
      next();
    })
      .catch(function (error) {
        console.error("counter error-> : " + error);
        throw error;
      });
  }
});

InvoiceSchema.methods.updateAnticipation = function (datePayment) {
  var invoice = this;

  invoice.anticipation = true;
  invoice.status = 1;
  invoice.newDatePayment = datePayment;

  return invoice.save();
};

InvoiceSchema.methods.reviewAnticipation = function (status, datePayment) {
  var invoice = this;

  invoice.status = status;
  invoice.datePayment = datePayment;

  return invoice.save();
};

InvoiceSchema.methods.toJSONFor = function () {
  return {
    _id: this._id,
    number: this.number,
    description: this.description,
    dateBilling: this.dateBilling,
    datePayment: this.datePayment,
    newDatePayment: this.newDatePayment,
    status: this.status,
    anticipation: this.anticipation,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

mongoose.model('Invoice', InvoiceSchema);
