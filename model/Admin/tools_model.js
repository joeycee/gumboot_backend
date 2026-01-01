const mongoose = require('mongoose');

const toolsSchema = new mongoose.Schema({

  tool_name: {type: String},
  status: {type: Number, default:1 },

}, {timestamps:true});

module.exports = mongoose.model('tools', toolsSchema);