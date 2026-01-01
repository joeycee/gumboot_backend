const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

  name: {type: String},
  image:[{type:String}],
  status: {type: Number, default:1 },

}, {timestamps:true});

module.exports = mongoose.model('category', categorySchema);