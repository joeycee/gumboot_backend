let mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    jobId:  { type: mongoose.Schema.Types.ObjectId, ref: "job"},
    job_status:  { type: mongoose.Schema.Types.ObjectId, ref: "job"},
    message: {type: String, default: ""},
    type: {type: Number, default: ""},
    status:{type:Number,default:0},  // 0 for unread, 1 for read
},
    {timestamps: true});

module.exports = mongoose.model('notification', notificationSchema);