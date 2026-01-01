const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "user",default: null},
  servicefee: {type: mongoose.Schema.Types.ObjectId, ref: "service_fee", default: "658bdabbc509afc52a3e028b"},
  job_title: {type: String, default: ''},
  job_type: { type: mongoose.Schema.Types.ObjectId, ref: "category"},
  address: { type: mongoose.Schema.Types.ObjectId, ref: "address"},
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category"},
  isUrgent: {type: Number, 
    enum: [0, 1],
    default: 0
  },
  guest_user: {type: Number, default:0 },
  date: {type: String, default: ''}, 
  date_type: {type: String, 
    enum: ['0', '1', '2', '3', '4'],  //1 for urgent, 2 for exact date, 3 for before date, 4 for after date
    default: '0'},  

  shift_time: {type: String,
    enum:['am', 'pm'], 
    default: 'am'},
  exact_time: {type: String, default: ''},
  price: {type: String, default: ''},
  price_assured: {type: String, 
    enum: ['0', '1'],    // 0 for not_assured, 1 for assured
    default: '0'},
  admin_service_Amount : {type: String, default: ''},
  worker_Receive_Amount :  {type: String, default: ''},
  est_time: {type: String, default: ''},
  exp_date: {type: Date},
  description: {type: String, default: ''},
  tools_required: {type: Boolean, default: false }, 
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false
    },
    coordinates: {
      type: [Number],
      default: [0,0],   //default coordinates
      required: false,
    }
  },
  image: [{
     url:{type:String}
  }],
  image_before_job: [{
    url:{type:String}
  }],
 image_after_job: [{
  url:{type:String}
  }],
  deleted: {type: Boolean, default: false},
  job_status: {type: String, default: 0},  // 1 applied by worker/pending, 2 accepted, 3 on going, 4 rejected by user, 5 cancel by worker, 6 completed by worker, 7 edned by worker 
  status: {type: Number, default: 1 },  // 0 for inactive, 1 for active job
  transectionId: {type: String, default:"" }, 
  transectionStatus: {type: String, default:"" }, 
  rating: {type: Number},
  isApply: {type: Number},
  jobrequestId:{ type: mongoose.Schema.Types.ObjectId, ref: "jobrequest"},

}, {timestamps:true});

module.exports = mongoose.model('job', jobSchema);