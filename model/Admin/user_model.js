const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({


  categoryId:{ type: mongoose.Schema.Types.ObjectId, ref: "category"},
  jobrequest: {type: mongoose.Schema.Types.ObjectId, ref: "jobrequest"},

  firstname: {type: String, default: ''},
  lastname: {type: String, default: ''},
  email: {type: String, default: ''},
  password: {type: String, default: ''},
  address: {type: String, default: ''},
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
  country_code: {type: Number},
  phone: {type: Number, default: ''},
  image: {type:String, default: ''},
  bio: {type: String, default: ''},
  skill: [{ type: mongoose.Schema.Types.ObjectId, ref: "category", default:null}],
  tools: [{ type: mongoose.Schema.Types.ObjectId, ref: "tools", default:null}],
  idproof:{type:String, default: ''},
  selfie:{type:String, default: ''},
  status: {type: Number, default:1 },
  user_job_cancellation_fee: {type: String, default: '0'},
  worker_job_cancellation_fee: {type: String, default: '0'},
  notification_status: {type: Number, default:1},
  wallet_amount: {type: Number, default: 0},
  device_token: {type: String},
  device_type: {
    type: Number,
    required: false,
    enum: [1, 2, ], //1 for Android, 2 for IOS
  },
  user_To_Worker: {type: Number, 
    enum: [0, 1],
    default: 0 },
  worker_To_User: {type: Number, 
    enum: [0, 1],
    default: 0 },
  google: {type: String},     //social login
  facebook: {type: String},  //social login
  apple: {type: String},     //social login
  socialtype: {type: String, enum: ["0", "1", "2", "3"]},
  otp:{type:String},
  constant_id: {type: Number, default:null},
  otpverify:{type:Number,default:0},
  verified_user:{type:Number,default:0},
  forgotPasswordToken: {type: String},
  loginTime:{type: String, default:"" },
  stripe_customer:{type:String,default:""},
  role: {type:String, enum:["0", "1", "2"], default:"1"}, //0 for Admin, 1 for user, 2 for Worker

}, {timestamps:true});


module.exports = mongoose.model('user', UserSchema);