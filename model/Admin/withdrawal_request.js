const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  amount: {type: String},
  payment_status: {type: Number},
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('withdrawal_request', withdrawalSchema);