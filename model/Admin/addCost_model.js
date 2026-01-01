const mongoose = require('mongoose');

const addCostSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  jobId:{ type: mongoose.Schema.Types.ObjectId, ref: "jobrequest"},
  image: [{type: String}],
  amount: {type: String},
  description: {type: String},
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('addCost', addCostSchema);