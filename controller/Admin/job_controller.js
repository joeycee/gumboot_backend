let job_model = require('../../model/Admin/job_model')
let address_model = require('../../model/Admin/address_model')
let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')


module.exports = {

    add_job: async (req, res) => {
        try {
         let title = "job_list"
         let job_type =  await category_model.find();
         let address =  await address_model.find();
          res.render('Admin/jobtype/add_job', {title, address, job_type, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
          console.log(error)
        }
    },

    create_job: async(req, res)=> {
        try {
         
             // upload image
             let imgdata = [];
             if (req.files && req.files.image && Array.isArray(req.files.image))
             for (i in req.files.image) {
                 let image = req.files.image[i];
                 imgdata.push(helper.imageUpload(image, "images"));
             }
             else {
             req.files && req.files.image;
             let image = req.files.image;
             imgdata.push(helper.imageUpload(image, "images"));
             }

            let jobs = await job_model.create({

                name: req.body.name,
                image: req.body.image,
                job_title: req.body.job_title,
                job_type: req.body.job_type,
                location: req.body.location,
                description: req.body.description,
                price: req.body.price,
                address: req.body.address,
                exp_date: req.body.exp_date,
                est_time: req.body.est_time,
            })
            
            res.redirect('/job_list')
        } catch (error) {
            console.log(error)
        }
    },

    job_list: async(req, res)=> {
        try {
            let title = "job_list"
            let jobdata = await job_model.find({deleted: false}).sort({createdAt:-1}).populate("job_type")

            res.render('Admin/jobtype/job_list', {title, jobdata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    view_job: async(req, res)=> {
        try {
            let title = "job_list"
            let viewjob = await job_model.findById({_id: req.params.id}).populate("address").populate("job_type")
            res.render('Admin/jobtype/view_job', { title, viewjob, session: req.session.user, msg: req.flash('msg')  })
        } catch (error) {
            console.log(error)
        }
    },

    edit_job: async(req, res)=> {
        try {
            let title = "job_list"
            let job_type = await category_model.find();
            let address = await address_model.find();
            let editjob = await job_model.findById({_id: req.params.id})
            res.render('Admin/jobtype/edit_job', { title, editjob, job_type, address, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    update_job: async(req, res)=> {
        try {
          if (req.files && req.files.image) {
            var image = req.files.image;
      
            if (image) {
              req.body.image = helper.imageUpload(image, "images");
            }
          }
  
          let user = await job_model.findByIdAndUpdate({_id: req.body.id},
            {
              job_title: req.body.job_title,
              job_type: req.body.job_type,
              price: req.body.price,
              est_time: req.body.est_time,
              exp_date: req.body.exp_date,
              description: req.body.description,
              image: req.body.image,
            }
            );
            req.flash("msg", "Updated successfully")
            res.redirect('/job_list')
        } catch (error) {
          console.log(error)
        }
    },

    Delete_job: async(req, res)=> {
        try {
          let userid = req.body.id;
          let remove = await job_model.findByIdAndUpdate({_id: userid}, { deleted: true})
          
          res.redirect('/job_list')
        } catch (error) {
          console.log(error)
        }
    },

    job_status: async (req, res) => {
        try {
          
        var check = await job_model.updateOne(
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




}