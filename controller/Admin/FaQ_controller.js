let FaQ_model = require('../../model/Admin/FaQ_model')
const helper = require('../../Helper/helper')

module.exports = {

add_faq: async(req, res)=> {
    try {
        title = "faq_list"
            res.render('Admin/FaQ/add_faq', {title, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
            console.log(error)
    }
},


create_faq: async(req, res)=> {
    try {
        
    let addfaq = await FaQ_model.create({

        question: req.body.question,
        answer: req.body.answer

    })

    res.redirect("faq_list")

    } catch (error) {
        console.log(error)
    }
},

faq_list: async(req, res)=> {
    try {
        title = "faq_list"
        let listing = await FaQ_model.find().sort({createdAt:-1})
        res.render('Admin/FaQ/faq_list', {title, listing, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
        console.log(error)
    }
},

view_faq: async(req, res)=> {
    try {
        let title = "faq_list"
        let faqData = await FaQ_model.findById({_id: req.params.id})
        res.render('Admin/FaQ/view_faq', { title, faqData, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
        console.log(error)
    }
},

edit_faq: async(req, res)=> {
    try {
        let title = "faq_list"
        let editData = await FaQ_model.findById({_id: req.params.id})
        res.render('Admin/FaQ/edit_faq', { title, editData, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
        console.log(error)
    }
},

update_faq: async(req, res)=> {
    try {
        
        let user = await FaQ_model.updateOne({_id: req.body.id},
            {
                question: req.body.question,
                answer: req.body.answer,
            } );
            req.flash("msg", "Updated successfully")
            res.redirect('/faq_list')
            
        } catch (error) {
            console.log(error)
        }
},

delete_faq: async(req, res)=> {
    try {
      let userid = req.body.id;
      let remove = await FaQ_model.deleteOne({_id: userid})
      res.redirect('/faq_list')
      
    } catch (error) {
      console.log(error)
    }
},



}