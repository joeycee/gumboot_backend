let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MessageSchema = new Schema({
    sender_id: {
        type: Schema.Types.ObjectId,
        index: true, 
        ref: 'users'
    },
    receiver_id: {
        type: Schema.Types.ObjectId,
        index: true, 
        ref: 'users'
    },
    constant_id: {
        type: Number,
        index: true, 
    },
    message: {
        type: String, 
        default: "" 
    },
    fileName: {
        type: String, 
        default: "" 
    },
    thumbnail: {
        type: String, 
        default: "" 
    },
    readStatus: {
        type: String,
        enum: ['0', '1'],  // 0 - unread, 1 - read
        default: '0'
    },
    is_read: {
        type: String,
        enum: ['0', '1'],  // 0 - unread, 1 - read
        default: '0'
    },
    type: {
        type: String, 
        default: "1"   //1 for text, 2 for image, 3 for video
    },
    deleted_by: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null 
    },

}, { timestamps: true });

const message = mongoose.model('messages', MessageSchema);
module.exports = message;
