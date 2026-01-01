let user_model = require('../../model/Admin/user_model')
let helper = require('../../Helper/helper')
const bcrypt = require('bcrypt');
var path = require('path');
let job_model = require('../../model/Admin/job_model')
let jobrequested = require('../../model/Admin/job_request')

const { Validator } = require('node-input-validator')

module.exports = {

    login_page: async (req, res)=> {
      res.render('Admin/login_page')
    },

    Login: async (req, res) => {
      try {

      let findUser = await user_model.findOne({ email: req.body.email });

      if (findUser) {
        let checkPassword = await bcrypt.compare(req.body.password, findUser.password);
        if (checkPassword == true) {
          req.session.user = findUser;

          console.log("Login Successfully");
          req.flash("msg", "Login Successful");
          res.redirect('/dashboard');
          // res.json("login successful")
        } else {
          console.log("Please enter valid password");
          req.flash("msg", "Incorrect password");
          res.redirect("/login_page");
          // res.json("incorrect password")
        }
      } else {
        console.log("Please enter valid email");
        req.flash("msg", "Incorrect email");
        res.redirect("/login_page");
        // res.json("incorrect email")
      }
      } catch (error) {
        console.log(error)
      }
    },

    add_user: async (req, res) => {
        try {
         let title = "user_list"
          res.render('Admin/user/add_user', {title, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
          console.log(error)
        }
    },

    signup: async(req, res)=> {
      try {
        // Check if this email already existed
        const userExist = await user_model.findOne({ email: req.body.email });
        if (userExist) {
          req.flash("msg", "Email already existed");
          res.redirect('/add_user');
          // return helper.failed(res,"Email Already Exist")
        }
        // Check if this phone already existed
        const phoneNumberExist = await user_model.findOne({ phone: req.body.phone });
        if (phoneNumberExist) {
          req.flash("msg", "Phone number already existed");
          res.redirect('/add_user');
          // return helper.failed(res,"Phone Number Already Exist")
        }
        // upload image
        if (req.files && req.files.image) {
          var image = req.files.image;
    
          if (image) {
            req.body.image = helper.imageUpload(image, "images");
          }
      }
        let hash = await bcrypt.hash(req.body.password, 10)
         
        let createuser = await user_model.create({
          role: req.body.role,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          phone: req.body.phone,
          bio: req.body.bio,
          image: req.body.image,
          password: hash,
          location: req.body.location,        
        });

       res.redirect('/user_list')
        console.log("signup successfully")
        return helper.success(res, "created successfully", createuser)
      } catch (error) {
        console.log(error)
      }
    },

    user_list: async(req, res)=> {
        try {
            let title = "user_list"
            let userdata = await user_model.find({role:1}).sort({createdAt:-1})
            res.render('Admin/user/user_list', {title, userdata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    view_user: async(req, res)=> {
        try {
            let title = "user_list"
            let viewuser = await user_model.findById({_id: req.params.id})

            let userpostedjobs = await job_model.find({ userId: req.params.id, deleted:false, }).populate("job_type")
            
            let userrequestedjobsRaw = await jobrequested.find({workerId: req.params.id, job_status: 7}).populate('jobId')
  
          // Filter only those where the populated jobId's job_status is 0
          let userrequestedjobs = userrequestedjobsRaw.filter(job => 
              job.jobId && job.jobId.job_status == 7
          )

            res.render('Admin/user/view_user', { title, viewuser, userpostedjobs, userrequestedjobs, session: req.session.user, msg: req.flash('msg')  })
        } catch (error) {
            console.log(error)
        }
    },

    edit_user: async(req, res)=> {
      try {
          let title = "user_list"
          let edituser = await user_model.findById({_id: req.params.id})
          res.render('Admin/user/edit_user', { title, edituser, session: req.session.user, msg: req.flash('msg') })
      } catch (error) {
          console.log(error)
      }
    },

    update_user: async(req, res)=> {
      try {
        if (req.files && req.files.image) {
          var image = req.files.image;
    
          if (image) {
            req.body.image = helper.imageUpload(image, "images");
          }
        }

        let user = await user_model.updateOne({_id: req.body.id},
          {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            location: req.body.location,
            image: req.body.image,
            bio: req.body.bio,
            phone: req.body.phone,
          }
          );
          req.flash("msg", "Updated successfully")
          res.redirect('/user_list')
      } catch (error) {
        console.log(error)
      }
    },

    delete_user: async(req, res)=> {
      try {
        let userid = req.body.id;
        let remove = await user_model.deleteOne({_id: userid})
        res.redirect('/user_list')
        
      } catch (error) {
        console.log(error)
      }
    },

    user_status: async (req, res) => {
      try {
        const { id, value } = req.body;

        const updateData = { status: value };

        if (value == 0) {
          updateData.loginTime = "";
        }

        await user_model.updateOne({ _id: id }, updateData);

        const user = await user_model.findOne({ _id: id });

        if (value == 0 && user?.device_token) {
          const payLoad = {
            device_token: user.device_token,
            message: "Your account has been set to inactive by admin.",
            type: 9,
          };

          await helper.send_push_notifications(payLoad);
        }

        req.flash("msg", "Status updated successfully");

        if (value == 0) return res.send(false);
        if (value == 1) return res.send(true);

      } catch (error) {
        console.error("Error updating user status:", error);
        return helper.error(res, "Something went wrong while updating user status.");
    }
    },

    logout: async (req, res) => {
      try {
        req.session.destroy((err) => { });
        res.redirect("/login_page");
      } catch (error) {
        helper.error(res, error);
      }
    },

    admin_profile: async (req, res) => {
      try {
        let title = "admin_profile"
        res.render('Admin/admin/admin_profile', { title, session: req.session.user, msg: req.flash('msg') })
      } catch (error) {
      console.log(error)
      }
    },
  
    update_admin_profile: async (req, res) => {
      try {
        
        if (req.files && req.files.image) {
          var image = req.files.image;
  
          if (image) {
            req.body.image = helper.imageUpload(image, "images");
          }
        }
        console.log(req.session.user._id);
        const userData = await user_model.findByIdAndUpdate(
          { _id: req.session.user._id },
          {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            image: req.body.image,
            location: req.body.location,
            phone: req.body.phone,
          }
        );
        let data = await user_model.findById({ _id: req.session.user._id });
        req.session.user = data;
        req.flash("msg", "Update profile successfully");
        if (userData) {
          res.redirect("back");
        } else {
          res.redirect("back");
        }
      } catch (error) {
        console.log(error);
      }
    },

    change_password: async(req, res)=> {
      try {
          let title = "change_password"
          res.render('Admin/admin/change_password', {title, session: req.session.user, msg: req.flash('msg')})
      } catch (error) {
          console.log(error)
      }
    },

    Update_password: async function (req, res) {
      try {
        const V = new Validator(req.body, {
          oldPassword: "required",
          newPassword: "required",
          confirm_password: "required|same:newPassword",
        });

        V.check().then(function (matched) {
          console.log(matched);
          console.log(V.errors);
        });
        let data = req.session.user;

        if (data) {
          let comp = await bcrypt.compare(V.inputs.oldPassword, data.password);

          if (comp) {
            const bcryptPassword = await bcrypt.hash(req.body.newPassword, 10);
            let create = await user_model.updateOne(
              { _id: data._id },
              { password: bcryptPassword }
            );
            req.session.user = create;
            req.flash('msg', 'Update password successfully')
            res.redirect("/login_page");
          } else {
            req.flash('msg', 'Old password do not match')
            res.redirect("/change_password");
          }
        }
      } catch (error) {
          console.log(error) 
        }
    },



}