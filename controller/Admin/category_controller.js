let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')


module.exports = { 

    add_category: async(req, res)=> {
        try {
            let title = "category_list"
            res.render('Admin/category/add_category', { session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    Create_category: async (req, res) => {
        try {
    
        if (req.files && req.files.image) {
          var image = req.files.image;
    
          if (image) {
            req.body.image = helper.imageUpload(image, "images");
          }
        }
        let user = await category_model.create({
          image: req.body.image,
          name: req.body.name,
        })
        req.flash("msg", "User created successfully")
        res.redirect('/category_list')
        res.json(user)
    
      } catch (error) {
          console.log(error)
      }
    },

    category_list: async(req, res)=> {
        try {
            title = "category_list"
            let catedata = await category_model.find().sort({createdAt:-1})
            res.render('Admin/category/category_list', {title, catedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    view_category: async(req, res)=> {
        try {
            let title = "category_list"
            let cateData = await category_model.findById({_id: req.params.id})
            res.render('Admin/category/view_category', { title, cateData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    edit_category: async(req, res)=> {
        try {
            let title = "category_list"
            let editData = await category_model.findById({_id: req.params.id})
            res.render('Admin/category/edit_category', { title, editData,  session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    update_category: async(req, res)=> {
        try {
            if (req.files && req.files.image) {
                var image = req.files.image;
          
                if (image) {
                  req.body.image = helper.imageUpload(image, "images");
                }
              }
            
            let user = await category_model.updateOne({_id: req.body.id},
                {
                    image: req.body.image,
                    name: req.body.name,
                } );
                req.flash("msg", "Updated successfully")
                res.redirect('/category_list') 
        } catch (error) {
            console.log(error)
        }
    },

    delete_category: async(req, res)=> {
        try {
          let userid = req.body.id;
          let remove = await category_model.deleteOne({_id: userid})
          res.redirect('/category_list')
          
        } catch (error) {
          console.log(error)
        }
    },

    category_status: async (req, res) => {
        try {
          
        var check = await category_model.updateOne(
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