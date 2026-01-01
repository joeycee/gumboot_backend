let review_model = require('../../model/Admin/review_model')
let user_model = require('../../model/Admin/user_model')


module.exports = {

    create_review: async(req, res)=> {
        try {
            let workerreview = await review_model.create({

                userId:req.body.userId,
                workerId:req.body.workerId,
                rating: req.body.rating,
                comment: req.body.comment
            })
            res.redirect('/review_list')
            res.json("workerreview")

        } catch (error) {
            console.log(error)
        }
    },

    add_review: async(req, res)=> {
        try {
            let title = "review_list"
            let user = await user_model.find();
            let worker = await worker_model.find();
            res.render('Admin/review/add_review', {title, user, worker, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            
        }
    },

    review_list: async(req, res)=> {
        try {
            let title = "review_list"
            let reviewdata = await review_model.find().populate("userId").populate("workerId")

            res.render('Admin/review/review_list', {title, reviewdata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            
        }
    },

    view_review: async(req, res)=> {
        try {
            let title = "review_list"
            let userdata = await review_model.findById({ _id: req.params.id }).populate("userId").populate("workerId")
            res.render('Admin/review/view_review', { title, userdata, session: req.session.user, msg: req.flash('msg') })
          } catch (error) {
            console.log(error)
          }
    },
    
    delete_review: async(req, res)=> {
        try {
            let userid = req.body.id;
            let remove = await review_model.deleteOne({_id: userid})
            res.redirect('/review_list')
        } catch (error) {
            console.log(error)
        }
    }




}