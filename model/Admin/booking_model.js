const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  job_type:{ type: mongoose.Schema.Types.ObjectId, ref: "category"},
  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},

  jobtitle: {type: String},
  price: {type: String},
  image: {type: String},
  location: {type: String},
  description: {type: String},
  status: {type: Number, default:0 },

}, {timestamps:true});


module.exports = mongoose.model('booking', bookingSchema);
