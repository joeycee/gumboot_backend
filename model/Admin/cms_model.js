const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema({
  
  title: {type: String},
  description: {type: String},

  role: {type:String, enum:["1", "2", "3"]}, //1 for Aboutus, 2 for Terms%condition, 3 for privacy//

}, {timestamps:true});

module.exports = mongoose.model('cms', cmsSchema);