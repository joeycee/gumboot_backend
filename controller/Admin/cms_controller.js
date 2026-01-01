let cms_model = require('../../model/Admin/cms_model')

module.exports = {

  Create: async(req, res)=> {
    try {
        let create = await cms_model.create({

            title: req.body.title,
            description: req.body.description,
            role: req.body.role
        })

        res.json({create})
    } catch (error) {
        console.log(error)
    }
  },

  Aboutus: async(req, res)=> {
        try {
            let title = "Aboutus"
            let data = await cms_model.findOne({role:1})
            res.render('Admin/CMS/Aboutus', {title, data, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
  },
  Update_aboutus: async (req, res) => {
    try {

      const aboutus = await cms_model.updateOne({ _id: req.body.id },
        { role: req.body.role,
          description: req.body.description,
        }
      );
      req.flash("msg", "Updated successfully")
      res.redirect("back");

    } catch (error) {
      console.log(error);
    }
  },

  terms_condition: async(req, res)=> {
        try {
           let title = "terms_condition"
           let data = await cms_model.findOne({role:2})
            res.render('Admin/CMS/terms_condition', {title, data, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
          console.log(error)  
        }
  },
  Update_terms: async (req, res) => {
    try {

      const terms = await cms_model.updateOne({ _id: req.body.id },
        { role: req.body.role,
          description: req.body.description,
        }
      );
      req.flash("msg", "Updated successfully")
      res.redirect("back");

    } catch (error) {
      console.log(error);
    }
  },

  privacy_policy: async(req, res)=> {
    try {
       let title = "privacy_policy"
       let data = await cms_model.findOne({role:3})
        res.render('Admin/CMS/privacy_policy', {title, data, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
      console.log(error)  
    }
  },





}