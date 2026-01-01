const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({

  userId:{type:mongoose.Schema.Types.ObjectId, ref:"user"},
  workerId: {type:mongoose.Schema.Types.ObjectId, ref:"user"},
  jobId: {type:mongoose.Schema.Types.ObjectId, ref:"job"},
  rating: {type: String, default: ''},
  comment: {type: String, default: ''},
  rater_role: {type: String, default:''},

}, {timestamps:true});

module.exports = mongoose.model('review', reviewSchema);