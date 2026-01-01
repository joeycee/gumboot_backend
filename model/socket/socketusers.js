const mongoose = require("mongoose");

const socketuserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    socketId: { type: String },
    
    onlineStatus: {
      type: Number,
      enum: [0, 1], // 0 = online, 1 = offline
    },

    status: {
      type: String,
      enum: [0, 1], // 0 = online, 1 = offline
    },
    user_connectedTo: {
      type: String,
      required:false, 
    },

  },
  
  { timestamps: true }
);
const socketuser = mongoose.model("socketusers", socketuserSchema);
module.exports = socketuser;
