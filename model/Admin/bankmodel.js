const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  account_name: {type: String},
  bank_name: {type: String},
  account_number: {type: String},
  default: {type: Number, default: 0},
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('bank', bankSchema);