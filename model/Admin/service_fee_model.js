const mongoose = require('mongoose');

let service_feeSchema = new mongoose.Schema({

  adminId: {type:mongoose.Schema.Types.ObjectId, ref:"user"},
  // service_fee: {type: String, default: ''},
  service_charge: {type: String, default: ''},
  job_cancellation_fee: {type: String, default: ''},

}, {timestamps: true});

module.exports = mongoose.model('service_fee', service_feeSchema);