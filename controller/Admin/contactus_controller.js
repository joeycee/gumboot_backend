
let supportmodel = require('../../model/Admin/support_model')

module.exports = {

    contact_list: async(req, res)=> {
        try {
            let title = "contact_list"
            let messagedata = await supportmodel.find({}).sort({ createdAt: -1 });
            res.render('Admin/contact/contact_list', {title, messagedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },


    view_message: async(req, res)=> {
        try {
            let title = "contact_list"
            let messagesdata = await supportmodel.findById({_id: req.params.id})
            res.render('Admin/contact/view_message', {title, messagesdata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    delete_message: async(req, res)=> {
        try {
            let title = "contact_list"
            let userid = req.body.id;
            let remove = await supportmodel.deleteOne({_id: userid})
            res.redirect('/contact_list')
        } catch (error) {
            console.log(error)
        }
    },

    





}