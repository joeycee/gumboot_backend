var express = require('express');
var router = express.Router();
var dashboard_controller = require('../controller/Admin/dashboard_controller')
var user_controller = require('../controller/Admin/user_controller')
var category_controller = require('../controller/Admin/category_controller');
const cms_controller = require('../controller/Admin/cms_controller');
const contactus_controller = require('../controller/Admin/contactus_controller');
const booking_controller = require('../controller/Admin/booking_controller')
var {session} = require('../Helper/helper')

const worker_controller = require('../controller/Admin/worker_controller');
const review_controller = require('../controller/Admin/review_controller');
const job_controller = require('../controller/Admin/job_controller');
const FaQ_controller = require('../controller/Admin/FaQ_controller');
const tools_controller = require('../controller/Admin/tools_controller');
const report_controller = require('../controller/Admin/report_controller');
const service_fee_controller = require('../controller/Admin/service_fee_controller');
const profile_swap_controller = require('../controller/Admin/profile_swap_controller');
const withdraw_controller = require('../controller/Admin/withdraw_controller')


router.get('/login_page', user_controller.login_page)
router.post('/Login', user_controller.Login)
router.get('/forgot_password', dashboard_controller.forgot_password)
router.get('/dashboard', session, dashboard_controller.dashboard)

//////////////// ADMIN //////////////////////////
router.get('/admin_profile', session, user_controller.admin_profile)
router.post('/update_admin_profile', user_controller.update_admin_profile)
router.get('/change_password', session, user_controller.change_password)
router.post('/Update_password', user_controller.Update_password)

/////////////// USER //////////////////////////
router.get('/add_user', session, user_controller.add_user)
router.post('/signup', user_controller.signup)
router.get('/user_list', session, user_controller.user_list )
router.get('/view_user/:id', session, user_controller.view_user)
router.get('/edit_user/:id', session, user_controller.edit_user)
router.post('/update_user', user_controller.update_user)
router.delete('/delete_user/:id', user_controller.delete_user)
router.post('/user_status', user_controller.user_status)
router.get('/logout', user_controller.logout)


////////////// WORKER /////////////////////
router.get('/add_worker', session, worker_controller.add_worker)
router.get('/worker_list', session, worker_controller.worker_list)
router.post('/create_worker', worker_controller.create_worker)
router.get('/view_worker/:id', session, worker_controller.view_worker)
router.get('/edit_worker/:id', session, worker_controller.edit_worker)
router.post('/update_worker', worker_controller.update_worker)
router.post('/worker_status', worker_controller.worker_status)
router.delete('/delete_worker/:id', worker_controller.delete_worker)

////////////////// JOB TYPE ///////////////////////////
router.post('/create_job', job_controller.create_job)
router.get('/add_job', session, job_controller.add_job)
router.get('/job_list', session, job_controller.job_list)
router.get('/view_job/:id', session, job_controller.view_job)
router.get('/edit_job/:id', session, job_controller.edit_job)
router.post('/update_job', job_controller.update_job)
router.post('/Delete_job/:id', job_controller.Delete_job)
router.post('/job_status', job_controller.job_status)

////////////// CATEGORY /////////////////////////////
router.get('/category_list', session, category_controller.category_list)
router.get('/add_category', session, category_controller.add_category)
router.post('/Create_category', category_controller.Create_category)
router.get('/view_category/:id', session, category_controller.view_category)
router.get('/edit_category/:id', session, category_controller.edit_category)
router.post('/update_category', category_controller.update_category)
router.delete('/delete_category/:id', category_controller.delete_category)
router.post('/category_status', category_controller.category_status)

/////////////////  TOOLS  ////////////////////////
router.get('/addToolsPage', session, tools_controller.addToolsPage)
router.post('/add_tools', tools_controller.add_tools)
router.get('/tools_listing', session, tools_controller.tools_listing)
router.get('/view_tools/:id', session, tools_controller.view_tools)
router.get('/edit_tools/:id', session, tools_controller.edit_tools)
router.post('/update_tools', tools_controller.update_tools)
router.delete('/delete_tools/:id', tools_controller.delete_tools)
router.post('/tools_status', tools_controller.tools_status)

///////////////// CONTACT US ///////////////////////////
router.get('/contact_list', session, contactus_controller.contact_list) 
router.get('/view_message/:id', session, contactus_controller.view_message)
router.delete('/delete_message/:id', contactus_controller.delete_message)

//////////// BOOKING ///////////////////////////
router.get('/add_booking', session, booking_controller.add_booking)
router.post('/create_booking', booking_controller.create_booking)
router.get('/bookingsList', session, booking_controller.bookingsList)
router.get('/viewBooking/:id', session, booking_controller.viewBooking)
router.get('/filterData', session, booking_controller.filterData)
router.post('/bookingStatus', booking_controller.bookingStatus)
router.get('/editBooking/:id', session, booking_controller.editBooking)
router.post('/updateBooking', booking_controller.updateBooking)
router.delete('/deleteBooking/:id', booking_controller.deleteBooking)
router.get('/completedjobs', session, booking_controller.completedjobs)



////////////////////// CMS //////////////////////////
router.post('/Create', cms_controller.Create)
router.get('/Aboutus', session, cms_controller.Aboutus)
router.post('/Update_aboutus', cms_controller.Update_aboutus)
router.get('/terms_condition', session, cms_controller.terms_condition)
router.post('/Update_terms', cms_controller.Update_terms)
router.get('/privacy_policy', session, cms_controller.privacy_policy)

////////////////// REVIEW ///////////////////
router.post('/create_review', review_controller.create_review)
router.get('/add_review', session, review_controller.add_review)
router.get('/view_review/:id', session, review_controller.view_review)
router.get('/review_list', session, review_controller.review_list)
router.delete('/delete_review/:id', review_controller.delete_review)

/////////////// PROFILE SWAP LIST ///////////////////////////
router.get('/profile_swap_list', session, profile_swap_controller.profile_swap_list)


////////////// F AND Q ////////////
router.get('/add_faq', session, FaQ_controller.add_faq)
router.post('/create_faq', FaQ_controller.create_faq)
router.get('/faq_list', session, FaQ_controller.faq_list)
router.get('/view_faq/:id', session, FaQ_controller.view_faq)
router.get('/edit_faq/:id', session, FaQ_controller.edit_faq)
router.post('/update_faq', FaQ_controller.update_faq)
router.delete('/delete_faq/:id', FaQ_controller.delete_faq)

///////////////// REPORT  /////////////////////////
router.get('/report_list', session, report_controller.report_list)
router.post('/report_request', report_controller.report_request)
router.get('/view_report/:id', session, report_controller.view_report)
router.delete('/delete_report/:id',report_controller.delete_report )

////////////// SERVICE FEE ////////////
router.post('/add_service_fee', service_fee_controller.add_service_fee)
router.get('/serviceFee_list', service_fee_controller.serviceFee_list)
router.get('/edit_serviceFee/:id', service_fee_controller.edit_serviceFee)
router.post('/update_serviceFee', service_fee_controller.update_serviceFee)



////////////// Withdraw Requests /////////////////////////////
router.get('/withdraw_list', session, withdraw_controller.withdraw_list)
router.get('/withdrawView/:id', session, withdraw_controller.withdrawView)
router.post('/WithdrawStatusUpdate', withdraw_controller.WithdrawStatusUpdate)




module.exports = router;
