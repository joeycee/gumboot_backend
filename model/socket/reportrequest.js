let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ReportSchema = new Schema({
    reportTo: {
        type: Schema.Types.ObjectId,
        index: true, 
        ref: 'user'
    },
    reportBy: {
        type: Schema.Types.ObjectId,
        index: true, 
        ref: 'user'
    },
    constant_id: {
        type: Number,
        index: true, 
    },
    message: {
        type: String, 
        default: "" 
    },

}, { timestamps: true });

const message = mongoose.model('Report', ReportSchema);
module.exports = message;
