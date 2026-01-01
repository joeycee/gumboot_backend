let review_model = require('../../model/Admin/review_model')
let user_model = require('../../model/Admin/user_model')
let job_model = require('../../model/Admin/job_model')
let notification_model = require('../../model/Admin/notification_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');

module.exports = {

    review_listing: async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1; 
                const perPage = parseInt(req.query.perPage) || 10; 
        
                const v = new Validator(req.body, {
                    userId: "required",
                });
        
                const errorResponse = await helper.checkValidation(v);
                if (errorResponse) {
                    return helper.failed(res, errorResponse);
                }
        
                const totalCount = await review_model.countDocuments({workerId: req.body.userId});
        
                const skip = (page - 1) * perPage;
                const totalPages = Math.ceil(totalCount / perPage);
        
                // Find reviews for the specified user and paginate the results
                const reviewData = await review_model
                    .find({workerId: req.body.userId})
                    .populate("userId", "firstname image role")
                    .populate("workerId", "firstname image role ")
                    .skip(skip).limit(perPage).sort({"createdAt":-1});
        
                if (!reviewData) {
                    return helper.failed(res, "Something went wrong", reviewData);
                }
        
                return helper.success(res, "Reviews list", {
                    reviewData,
                    page: page,
                    perPage: perPage,
                    totalPages: totalPages,
                    totalCount: totalCount // Include total count in the response
                });
            } catch (error) {
                console.error(error);
                return helper.failed(res, 'Something went wrong', error);
            }
    },

    add_review: async (req, res) => {
    try {
        let userId = req.user._id;
        const v = new Validator(req.body, {
            reciver_userId: "required",
            rating: "required",
            comment: "required",
            jobId: "required"
        });

        const values = JSON.parse(JSON.stringify(v));
        let error = await helper.checkValidation(v);

        if (error) {
            return helper.failed(res, error);
        }

        

        // role = req.user.role;
        let review = await review_model.create({
            userId: userId,
            workerId: req.body.reciver_userId,
            // userId: role == '1' ? req.user.id : req.body.reciver_userId,
            // workerId: role == '2' ? req.user.id : req.body.reciver_userId,
            // rater_role: role,   
            jobId: req.body.jobId,
            rating: req.body.rating,
            comment: req.body.comment,
        })

        if (!review) {
            return helper.failed(res, "Review submitted failed")
        }

        const jobdata = await job_model.findById(review.jobId._id);

        // Find the sender to get device information for push notification
        const sender = await user_model.findOne({ _id: userId });
        var receiverData = await user_model.findOne({ _id: req.body.reciver_userId });

        let payload = {};
        payload = sender;
        payload.title = "Message Sent ";
        payload.message = `${sender.firstname} added review to ${receiverData.firstname}`;
        payload.workerId = review.workerId
        const { device_token, device_type, type, firstname, image } = receiverData;

        
        let save_noti_data = {};
            save_noti_data.receiver = receiverData;
            save_noti_data.sender = req.user.id ;
            save_noti_data.type = 1;
            save_noti_data.jobId = review.jobId._id;
            save_noti_data.message = payload.message;

            await notification_model.create(save_noti_data);
            let objS = {
                device_type: receiverData.device_type,
                device_token: receiverData.device_token,
                sender_name: sender.firstname,
                sender_image: sender.image,
                message : payload.message,
                workerId : review.workerId,
                type:4,
                payload,
                save_noti_data
            }
            await helper.send_push_notification(objS);

        return helper.success(res, "Review submitted successfully", review)

    } catch (error) {
        console.log(error)
    }
    },
    
}