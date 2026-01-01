const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  jobId:{ type: mongoose.Schema.Types.ObjectId, ref: "job", default: null},
  transactionId: {type: String, default: ''},
  cancellation_charges: {type: String, default: ''},
  amount: {type: String, default: ''},  
  transaction_status: {
    type: Number,
    enum: [0, 1 ], // 
    default: 0 },

}, {timestamps: true});

module.exports = mongoose.model( 'transaction', transactionSchema );