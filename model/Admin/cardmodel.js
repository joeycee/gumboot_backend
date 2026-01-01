const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "users"},

  cardHolder_name: {type: String},
  card_number: {type: Number},
  expire_month: {type:String},
  expire_year: {type: String},
  cvv: {type: String},
  deleted: {type: Boolean, default: false},
  card_token:{type: String,default:""},
}, {timestamps:true});

module.exports = mongoose.model('card', cardSchema);