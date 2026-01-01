const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  bank_id: { type: mongoose.Schema.Types.ObjectId, ref: "bank" },
  amount: { type: String, default: '' },
  status: { 
    type: Number, 
    enum: [0, 1, 2], // 0: Pending, 1: Approved, 2: Rejected
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('withdraw_request', withdrawSchema);
