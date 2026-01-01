const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "users", default: null},
  address: {type: String, default: ""},
  state: {type: String, default: ""},
  country_code: {type: Number},
  country: {type: String, default: ""}, 
  zipcode: {type: String, default: ''},
  location : { type: {type:String}, coordinates: [Number]},
  city: {type: String, default: ""},
  street: {type: String, default: ""},
  building_number: {type: String},
  note: {type: String, default: ""},  
  status: {type: Number, default:1 },
  guest_user: {type: Number, default:0 },
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('address', addressSchema);