const mongoose = require('mongoose');

const cardLinkSchema = new mongoose.Schema({
  
  title: {type: String},
  description: {type: String},

}, {timestamps:true});

module.exports = mongoose.model('cardLink', cardLinkSchema);