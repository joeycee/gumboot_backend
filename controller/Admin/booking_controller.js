let booking_model = require('../../model/Admin/booking_model')
let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let job_model = require('../../model/Admin/job_model')
let addCost = require('../../model/Admin/addCost_model')
const service_fee = require('../../model/Admin/service_fee_model')
const transactionModel = require('../../model/Admin/transaction_model')
let helper = require('../../Helper/helper')

module.exports = { 

  add_booking: async(req, res)=> {
      try {
          let title = "booking_list"
          let user = await user_model.find({role:1});
          let job_type =  await category_model.find();
          let worker = await user_model.find({role:2});
          res.render('Admin/booking/add_booking', {title, job_type, user, worker, session: req.session.user, msg: req.flash('msg')})
      } catch (error) {
          console.log(error) 
      }
  },

  create_booking: async (req, res) => {
      try {
  
      if (req.files && req.files.image) {
        var image = req.files.image;
  
        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }

      let user = await booking_model.create({
      job_type: req.body.job_type,
      userId: req.body.userId,
      workerId: req.body.workerId,
      image: req.body.image,
      jobtitle: req.body.jobtitle,
      price: req.body.price,
      description: req.body.description
      })
      req.flash("msg", " created successfully")
      res.redirect('/booking_list')
  
    } catch (error) {
        console.log(error)
    }
  },

  bookingsList: async(req, res)=>{

      try {
        let title = "bookingsList"
        
        var where={workerId:{$ne:null}}
        if(req.query.job_status==0){
          where.job_status=0
        }else if(req.query.job_status==1){
          where.job_status=1
        }else if(req.query.job_status==2){
          where.job_status=2
        }else if(req.query.job_status==3){
          where.job_status=3
        }else if(req.query.job_status==4){
          where.job_status=4
        }else if(req.query.job_status==5){
          where.job_status=5
        }else if(req.query.job_status==6){
          where.job_status=6
        }else if(req.query.job_status==7){
          where.job_status=7
        }
        
        let bookingdata = await job_model.find(where).sort({createdAt:-1}).populate("job_type").populate("userId").populate("workerId")
        res.render("Admin/booking/bookingsList", {title, bookingdata, session: req.session.user, msg: req.flash('msg') })
       
      } catch (error) {   
        console.log(error)
      }
  },

  viewBooking: async(req, res)=> {
    try {
      let title = "bookingsList";
      const bookingdata = await job_model.findById({_id: req.params.id})
      .populate("job_type")
      .populate("userId")
      .populate("workerId")
      .populate("address");
     
      const serviceCharges = await service_fee.findOne();
      const addcostCharges = await addCost.findOne({jobId: req.params.id});
      
      if (!bookingdata || !serviceCharges) {
        return helper.failed(res, "Booking data or service charges not found");
      }
      
      const jobPrice = Number(bookingdata.price);
      const AddCost = addcostCharges ? Number(addcostCharges.amount) : 0; // Check if addcostCharges is found, else default to 0
      const ServiceCharges = Number(serviceCharges.service_charge);   //admin charges percentage

      const workerCharges = Number(jobPrice - ServiceCharges);
      const userServiceCharges = ((jobPrice + AddCost) * ServiceCharges) / 100;

      const workerServiceFee = Number(jobPrice * ServiceCharges) / 100;

      const totalservicecharges = workerServiceFee + userServiceCharges  

      const userfinalAmount = Number(jobPrice + AddCost + userServiceCharges);  //final amount paid by user
      const workerFinalAmount = Number(jobPrice + AddCost) - workerServiceFee

      const paidAmountByUser = await transactionModel.findOne({jobId: bookingdata})  // transaction history of amount paid by user
      
      res.render('Admin/booking/viewBooking', { title, bookingdata, serviceCharges, addcostCharges, userServiceCharges, paidAmountByUser, userfinalAmount, workerFinalAmount, workerCharges, workerServiceFee, totalservicecharges, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Error");
    }
  },
  
  editBooking: async(req, res)=> {
    try {
        let title = "bookingsList"
        let user =  await user_model.find({role:1});
        let job_type = await category_model.find();
        let worker = await user_model.find({role:2});
        let editdata = await job_model.findById({_id: req.params.id})
        res.render('Admin/booking/editBooking', {title, user, job_type, worker, editdata, session: req.session.user, msg: req.flash('msg')})
    } catch (error) {
      console.log(error)  
    }
  },

  updateBooking: async(req, res)=> {
    try {

        if (req.files && req.files.image) {
            var image = req.files.image;
    
            if (image) {
              req.body.image = helper.imageUpload(image, "images");
            }
        }
         let update = await job_model.findByIdAndUpdate({_id: req.body.id}, 

            {   userId: req.body.userId,
                job_type: req.body.job_type,
                workerId: req.body.workerId,
                image: req.body.image,
                price: req.body.price,
                jobtitle: req.body.jobtitle,
              
            });

            req.flash("msg", "Updated successfully")  
            res.redirect('/bookingsList')

    } catch (error) {
      console.log(error);            
        }
  },

  bookingStatus: async (req, res) => {
        
      var check = await booking_model.updateOne(
        { _id: req.body.id },
        { job_status: req.body.value }
      );

          if (check) {
            req.flash('msg', "Status Updated Successfully")
            res.send(false)
        }   
  },

  filterData:async(req,res)=>{
      try{
        var where={}
        if(req.body.status!=""){
          where.status=req.body.status
        }
        var bookingsArr=await job_model.find(where).populate("userId").populate("workerId").populate("categoryId")
        return res.json(bookingsArr)
      }catch(error){
        console.log(error)
      }
  },

  deleteBooking: async(req, res)=> {
    try {
      let userid = req.body.id;
      let remove = await job_model.deleteOne({_id: userid})
      res.redirect('/bookingsList')
      
    } catch (error) {
      console.log(error)
    }
  },


  completedjobs: async(req, res)=>{
    try {
      let title = "bookingsList"
      
      let bookingdata = await job_model.find({job_status:7, deleted:false}).sort({createdAt:-1}).populate("job_type").populate("userId").populate("workerId")
      res.render("Admin/booking/completedjobs", {title, bookingdata, session: req.session.user, msg: req.flash('msg') })
     
    } catch (error) {   
      console.log(error)
    }
},

}