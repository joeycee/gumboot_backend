const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  jobId:{ type: mongoose.Schema.Types.ObjectId, ref: "jobrequest"},
  amount: {type: String},
  payment_status: {type: Number},
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('wallet', walletSchema);