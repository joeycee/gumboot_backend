const mongoose = require('mongoose');

const FaQSchema = new mongoose.Schema({

  question: {type: String},
  answer: {type: String},
  
}, {timestamps:true});

module.exports = mongoose.model('f&q', FaQSchema);