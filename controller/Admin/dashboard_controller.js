let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let review_model = require('../../model/Admin/review_model')
let job_model = require('../../model/Admin/job_model')
let booking_model = require('../../model/Admin/booking_model')
let FaQ_model = require('../../model/Admin/FaQ_model')
let tools_model = require('../../model/Admin/tools_model')
let report_model = require('../../model/socket/reportrequest')
const support_model = require('../../model/Admin/support_model')
let withdraw_requests = require('../../model/Admin/withdraw_requests')


module.exports = {

    dashboard: async(req, res)=> {
        try {
            let title = "dashboard"
            let user = await user_model.count({role:1})
            let worker = await user_model.count({role:2})
            let category = await category_model.count()
            let messages = await support_model.count()
            let reviews = await review_model.count()
            let jobs = await job_model.count( {deleted:false})
            let booking = await job_model.count({workerId:{$ne:null}})
            let tools = await tools_model.count()
            let FAQ = await FaQ_model.count()
            let reports = await report_model.count()
            let withdrawals = await withdraw_requests.count()
            // let completejobs = await job_model.count({job_status:7})
            let admindata = await user_model.findOne({_id:req.session.user})
            let adminwallet = admindata.wallet_amount;            
            res.render('Admin/dashboard', {title, user, worker, adminwallet, category, messages, reviews, jobs, tools, FAQ, booking, reports,withdrawals, session: req.session.user, msg: req.flash('msg')  })
        } catch (error) {
            console.log(error)
        }
    },

    forgot_password: async(req, res)=> {
        try {
            let title = "forgot_password"
            res.render('Admin/forgot_password', {title, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {
            
        }
    }


}