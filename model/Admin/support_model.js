const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  name: {type: String},
  mobile_number: {type: String},
  email: {type: String},
  message: {type: String},
  date: {
    type: Date,
    default: Date.now
  },
  
}, {timestamps:true});

module.exports = mongoose.model('support', supportSchema);