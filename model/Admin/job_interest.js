const mongoose = require('mongoose');

const jobInterestSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  status: {type: String, default: ""},  //1 for interested, 2 for not interested
  type: {type: String, default: "0"},  // 0 for default, 1 for weekly, 2 for monthly, 
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('jobInterest', jobInterestSchema);