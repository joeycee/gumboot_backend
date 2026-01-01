let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')
const bcrypt = require('bcrypt');


module.exports = {

    add_worker: async(req, res)=> {
        try {
            let title = "worker_list"
            let category =  await category_model.find();
            res.render('Admin/worker/add_worker', {title, category, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {
           console.log(error) 
        }
    },

    worker_list: async(req, res)=>{
        try {
            let title = "worker_list"
            let workerdata = await user_model.find({role:2}).sort({createdAt:-1})
          
             res.render('Admin/worker/worker_list', {title, workerdata, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {   
          console.log(error)
        }
    },

    create_worker: async(req, res)=> {
        try {
          // Check if this email already existed
          const userExist = await user_model.findOne({ email: req.body.email });
          if (userExist) {
            req.flash("msg", "Email already existed");
            res.redirect('/add_worker');
            // return helper.failed(res,"Email Already Exist")
          }
  
          // Check if this phone already existed
          const phoneNumberExist = await user_model.findOne({ phone: req.body.phone });
          if (phoneNumberExist) {
            req.flash("msg", "Phone number already existed");
            res.redirect('/add_worker');
            // return helper.failed(res,"Phone Number Already Exist")
          }

        if (req.files.image){
          let image = req.files.image;
          req.body.image = await helper.imageUpload(image, "images");
        }
        if (req.files.idproof){
          let idproof = req.files.idproof;
          req.body.idproof = await helper.imageUpload(idproof, "images");
        }
                
          let hash = await bcrypt.hash(req.body.password, 10)
           
          let createuser = await user_model.create({
            role:2,
            password: hash,
            ...req.body
          });
         res.redirect('/worker_list')
          console.log(createuser, "signup successfully")
          return helper.success(res, "created successfully", createuser)
          
        } catch (error) {
          console.log(error)
        }
    },

    view_worker: async(req, res)=> {
        try {
            let title = "worker_list"
            let workerdata = await user_model.findOne({_id: req.params.id}).populate("categoryId", "name")
          //  console.log(workerdata, "dchvdhcvdc mcc");return
            res.render('Admin/worker/view_worker', {title, workerdata, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {
          console.log(error)
        }
    },

    edit_worker: async(req, res)=> {
        try {
            let title = "worker_list"
            let category = await category_model.find();
            let editdata = await user_model.findById({_id: req.params.id})
            res.render('Admin/worker/edit_worker', {title, editdata, category, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {
          console.log(error)  
        }
    },

    update_worker: async(req, res)=> {
      try {

          if (req.files && req.files.image) {
              var image = req.files.image;
      
              if (image) {
                req.body.image = helper.imageUpload(image, "images");
              }
          }
           let update = await user_model.findByIdAndUpdate({_id: req.body.id}, 
              { 
                categoryId: req.body.categoryId,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                phone: req.body.phone,
                image: req.body.image,
                location: req.body.location,
                skill: req.body.skill,
                bio: req.body.bio,
              });

              req.flash("msg", "Updated successfully")  
              res.redirect('/worker_list')

      } catch (error) {
        console.log(error);            
          }
    },

    worker_status: async (req, res) => {
      try {
        
      var check = await user_model.updateOne(
        { _id: req.body.id },
        { status: req.body.value }
      );
      
      req.flash("msg", "Status update successfully");
        
      if (req.body.value == 0) res.send(false);
      if (req.body.value == 1) res.send(true);
    
      } catch (error) {
        console.log(error)
      }
    },

    delete_worker: async(req, res)=> {
      try {
        let userid = req.body.id;
        let remove = await user_model.deleteOne({_id: userid})
        res.redirect('/worker_list')
        
      } catch (error) {
        console.log(error)
      }
    },

   


}