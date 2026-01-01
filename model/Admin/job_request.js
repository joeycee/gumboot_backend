let mongoose = require('mongoose');

const jobrequestSchema = new mongoose.Schema({
    review: { type: mongoose.Schema.Types.ObjectId, ref: "review"},
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "job"},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    message: { type: String, default: ''},
    offered_price: { type: String, default: ''},
    job_status: {type: String, default: 1 }, // 1 applied by worker/pending, 2 accepted, 3 on going, 4 rejected by user, 5 cancel by worked, 6 completed by worker, 7 edned by worker
    job_type: { type: mongoose.Schema.Types.ObjectId, ref: "category"},

},
{timestamps: true});

module.exports = mongoose.model('jobrequest', jobrequestSchema);