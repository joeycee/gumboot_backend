var express = require('express');
var router = express.Router();

const addresscontroller = require('../controller/Api/addresscontroller');
let Authcontroller = require('../controller/Api/Authcontroller');
const bankcontroller = require('../controller/Api/bankcontroller');
const cardcontroller = require('../controller/Api/cardcontroller');
const categorycontroller = require('../controller/Api/categorycontroller');
const cmscontroller = require('../controller/Api/cmscontroller');
const jobcontroller = require('../controller/Api/jobcontroller');
const reviewcontroller = require('../controller/Api/reviewcontroller');
const supportcontroller = require('../controller/Api/supportcontroller');
const usercontroller = require('../controller/Api/usercontroller');
const workercontroller = require('../controller/Api/workercontroller');
const FaQcontroller = require('../controller/Api/FaQcontroller');
const addCostcontroller = require('../controller/Api/addCostcontroller');
const notificationcontroller = require('../controller/Api/notificationcontroller');
const toolscontroller = require('../controller/Api/toolscontroller');
const jobInterestcontroller = require('../controller/Api/jobInterestcontroller');
const transactioncontroller = require('../controller/Api/transactioncontroller');
const walletcontroller = require('../controller/Api/walletcontroller');
const withdrawController = require('../controller/Api/withdrawController');

const { authenticateJWT, authenticateHeader } = require("../Helper/helper");

// If you want header auth globally, uncomment:
// router.use(authenticateHeader);

///////////// AUTHENTICATION //////////////
router.post('/signup', Authcontroller.signup);
router.post('/socialLogin', Authcontroller.socialLogin);
router.post('/Login', Authcontroller.Login);
router.post('/otpVerify', Authcontroller.otpVerify);
router.post('/resend_otp', Authcontroller.resend_otp);

router.post('/logOut', authenticateJWT, Authcontroller.logOut);
router.delete('/deletedAccount', authenticateJWT, Authcontroller.deletedAccount);

//////////// CMS (public) ////////////////
router.get('/privacy_Policy', cmscontroller.privacy_Policy);
router.get('/about_us', cmscontroller.about_us);
router.get('/terms_conditions', cmscontroller.terms_conditions);

//////////// USER ////////////////////////
router.get('/profile', authenticateJWT, usercontroller.profile);
router.post('/edit_profile', authenticateJWT, usercontroller.edit_profile);
router.post('/id_verification', authenticateJWT, usercontroller.id_verification);

router.get('/worker_public_profile', authenticateJWT, usercontroller.worker_public_profile);
router.get('/jobsRequestedbyWorker', authenticateJWT, usercontroller.jobsRequestedbyWorker);
router.get('/jobsCompletedbyWorker', authenticateJWT, usercontroller.jobsCompletedbyWorker);
router.post('/role_change', authenticateJWT, usercontroller.role_change);

/////////// CARDS ////////////////////////
router.post('/add_card', authenticateJWT, cardcontroller.add_card);
router.post('/edit_card', authenticateJWT, cardcontroller.edit_card);
router.delete('/delete_card', authenticateJWT, cardcontroller.delete_card);
router.get('/card_list', authenticateJWT, cardcontroller.card_list);
router.post('/jobPayment', authenticateJWT, cardcontroller.jobPayment);

router.post('/add_card_link', cardcontroller.add_card_link);
router.get('/card_link', cardcontroller.card_link);

///////////////////// TOOLS /////////////////
router.post('/add_tools', authenticateJWT, toolscontroller.add_tools);
router.get('/tools_list', authenticateJWT, toolscontroller.tools_list);

/////////// WORKER /////////////////////////
router.get('/skillList', authenticateJWT, workercontroller.skillList);
router.get('/worker_job_listing', workercontroller.worker_job_listing); // public? ok
router.get('/jobs_listing', authenticateJWT, workercontroller.jobs_listing);

router.get('/applications', authenticateJWT, workercontroller.applications);
router.post('/update_Job_Status', authenticateJWT, workercontroller.update_Job_Status);
router.get('/user_public_profile', workercontroller.user_public_profile); // public? ok
router.get('/worker_job_requests', authenticateJWT, workercontroller.worker_job_requests);
router.get('/completedAndNewJobs', authenticateJWT, workercontroller.completedAndNewJobs);
router.get('/worker_completed_jobs', authenticateJWT, workercontroller.worker_completed_jobs);

/////////// BANK ///////////////////
router.post('/add_bank', authenticateJWT, bankcontroller.add_bank);
router.post('/edit_bank', authenticateJWT, bankcontroller.edit_bank);
router.delete('/delete_bank', authenticateJWT, bankcontroller.delete_bank);
router.get('/bank_list', authenticateJWT, bankcontroller.bank_list);
router.post('/set_default_bank', authenticateJWT, bankcontroller.set_default_bank);

///////// CATEGORY /////////////////////
router.post('/create_category', authenticateJWT, categorycontroller.create_category);
router.get('/category_list', categorycontroller.category_list); // public ok

///////// SUPPORT //////////////////////
// If you keep this public, add rate limiting + captcha later
router.post('/support', authenticateJWT, supportcontroller.support);

////////////////// NOTIFICATION ///////////////////
router.get('/notificationList', authenticateJWT, notificationcontroller.notificationList);
router.post('/change_notification_status', authenticateJWT, notificationcontroller.change_notification_status);
router.post('/UserNotificationStatus', authenticateJWT, notificationcontroller.UserNotificationStatus);
router.get('/unread_notification_count', authenticateJWT, notificationcontroller.unread_notification_count);
router.post('/read_notification', authenticateJWT, notificationcontroller.read_notification);

///////// JOB //////////////////////////
router.get('/home_job_listing', jobcontroller.home_job_listing);
router.get('/get_job_types', jobcontroller.get_job_types);
router.get('/job_details', jobcontroller.job_details);

// ✅ PRODUCTION FIX: make uploads + job creation authenticated
router.post('/add_job', authenticateJWT, jobcontroller.add_job);
router.post('/file_upload', authenticateJWT, jobcontroller.file_upload);

router.post('/edit_job', authenticateJWT, jobcontroller.edit_job);
router.get('/user_job_listing', authenticateJWT, jobcontroller.user_job_listing);
router.get('/completed_jobs', authenticateJWT, jobcontroller.completed_jobs);
router.delete('/delete_job', authenticateJWT, jobcontroller.delete_job);
router.post('/job_cancel', authenticateJWT, jobcontroller.job_cancel);
router.get('/jobAccToNameAndStatus', authenticateJWT, jobcontroller.jobAccToNameAndStatus);
router.get('/jobSearch', authenticateJWT, jobcontroller.jobSearch);
router.post('/applyjob', authenticateJWT, jobcontroller.applyjob);
router.post('/accept_Job', authenticateJWT, jobcontroller.accept_Job);
router.post('/update_jobSource_location', authenticateJWT, jobcontroller.update_jobSource_location);
router.post('/updateJobStatus', authenticateJWT, jobcontroller.updateJobStatus);
router.post('/delete_image', authenticateJWT, jobcontroller.delete_image);
router.post('/changeJobAddress', authenticateJWT, jobcontroller.changeJobAddress);
router.post('/addImageByWorker', authenticateJWT, workercontroller.addImageByWorker);
router.post('/my_requested_jobs', authenticateJWT, jobcontroller.my_requested_jobs);

////////////////////// JOB INTEREST //////////////
router.post('/jobInterested', authenticateJWT, jobInterestcontroller.jobInterested);
router.post('/updatejobInterested', authenticateJWT, jobInterestcontroller.updatejobInterested);
router.delete('/deleteInterest', authenticateJWT, jobInterestcontroller.deleteInterest);
router.get('/ReConnectJob_listing', authenticateJWT, jobInterestcontroller.ReConnectJob_listing);

////////// ADD COST ////////////////////
router.post('/add_additional_cost', authenticateJWT, addCostcontroller.add_additional_cost);
router.get('/additional_cost_list', authenticateJWT, addCostcontroller.additional_cost_list);

/////////////// TRANSACTION /////////////
router.post('/payment_transaction', authenticateJWT, transactioncontroller.payment_transaction);
router.get('/transaction_list', authenticateJWT, transactioncontroller.transaction_list);
router.get('/job_cancellation_charges', authenticateJWT, transactioncontroller.job_cancellation_charges);
router.get('/worker_transaction_history', authenticateJWT, transactioncontroller.worker_transaction_history);

////////////// WALLET ///////////////////
router.post('/wallet_transaction', authenticateJWT, walletcontroller.wallet_transaction);

////////// RATING ///////////////////////
router.post('/add_review', authenticateJWT, reviewcontroller.add_review);
router.get('/review_listing', authenticateJWT, reviewcontroller.review_listing);

////////// FAQ //////////////////////////
router.get('/faq_listing', FaQcontroller.faq_listing);

///////// ADDRESS ///////////////////////
// ✅ PRODUCTION FIX: addresses should be user-owned
router.post('/add_address', authenticateJWT, addresscontroller.add_address);

router.post('/edit_address', authenticateJWT, addresscontroller.edit_address);
router.get('/select_address', authenticateJWT, addresscontroller.select_address);
router.delete('/delete_address', authenticateJWT, addresscontroller.delete_address);
router.get('/citystatecountry', authenticateJWT, addresscontroller.citystatecountry);
router.post('/getState', authenticateJWT, addresscontroller.getState);
router.post('/getCity', authenticateJWT, addresscontroller.getCity);

/////////// Withdraw Requests ////////////
router.post('/withdrawRequest', authenticateJWT, withdrawController.withdrawRequest);
router.get('/withdrawList', authenticateJWT, withdrawController.withdrawList);

module.exports = router;
