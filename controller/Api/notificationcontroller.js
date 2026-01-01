const notification_model = require('../../model/Admin/notification_model')
const helper = require('../../Helper/helper')
const review_model = require('../../model/Admin/review_model')
const job_model = require('../../model/Admin/job_model')
const { Validator } = require('node-input-validator');
const user_model = require('../../model/Admin/user_model');

module.exports = {


  change_notification_status: async (req, res) => {
    try {

      const { status } = req.body;
      const userId = req.user._id;

      // Update the notification status for the user
      const updateNotificationStatus = await notification_model.updateMany(
        { receiver: userId },
        { status: status } // Set the new status
      );

      if (!updateNotificationStatus) {
        return helper.error(res, 'Unable to update notification status');
      }

      return helper.success(res, 'Notification status updated successfully', {});
    } catch (error) {
      console.log(error);
      return helper.failed(res, error);
    }
  },

  UserNotificationStatus: async (req, res) => {
    try {

      const status = await user_model.updateOne(
        { _id: req.user._id },
        { notification_status: req.body.notification_status }
      );

      let detail_user = await user_model.findById({ _id: req.user._id })

      let notificationStatus = detail_user;

      return helper.success(res, "Notification status update successfully", {
        notificationStatus,
      });

    } catch (error) {
      console.log(error);
    }
  },
  
  unread_notification_count: async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await notification_model.countDocuments({ receiver: userId, status:0 });


    return helper.success(res, "Unread notification count", { count: unreadCount });

  } catch (error) {
    console.log(error);
  }
  },

  read_notification: async (req, res) => {
    try {
      const userId = req.user._id;
      const v = new Validator(req.body, {
        // notificationId: "required",
      });
      
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      
      // let notificationId = req.body.notificationId;
      
      // const updateStatus = await notification_model.updateMany(
      //   {receiver: userId, 
      //     status: 0 },
      //   {status: 1 });

       const updateStatus = await notification_model.updateMany(
          { receiver: userId, status: 0 },
          { $set: { status: 1 } }
        );

        if (!updateStatus) {
          return helper.failed(res, "Notification not found");
        }

      // const updatedStatus = await notification_model.findById({ _id : notificationId });

        return helper.success(res, "Notification status updated successfully", {
          updatedNotification: {}
        });
    } catch (error) {
        console.error(error);
        return helper.failed(res, "Something went wrong");
    }
  },

  notificationList: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const notifications = await notification_model.find({ receiver: userId })
      .sort({createdAt:-1})
      .populate("sender", "firstname lastname image")
      .populate("jobId", "job_status userId workerId").sort({"createdAt":-1});
      
      if (!notifications || notifications.length === 0) {
        // If no notifications found, return an empty array
        return helper.success(res, 'Notification list', []);
      }
      // await notification_model.updateMany(
      //   { receiver: userId, status: 0 },
      //   { $set: { status: 1 } }
      // );
      
      const responseList = [];
      
      for (const notification of notifications) {
        const senderId = notification.sender ? notification.sender._id : null;
  
        // If senderId is null, you may choose to handle it accordingly or skip this notification
        if (!senderId) {
          continue;
        }
        
        const senderDetails = await user_model.findOne({ _id: senderId });
  
        var filter = {};
        if (senderDetails.role == 2) {
          filter = { workerId: senderDetails._id, rater_role: 1 };
        } else {
          filter = { userId: senderDetails._id, rater_role: 2 };
        }
  
        // Calculate the average rating for the sender of this notification
        const ratings = await review_model.find({workerId: senderId});
        
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
        const averageRating = count > 0 ? totalRating / count : 0;
  
        // Add the notification data along with the sender's average rating percentage to the response
        responseList.push({
          notification,
          senderRatingData: {
            count,
            averageRating: averageRating.toFixed(2) // Store the average rating with two decimal places
          }
        });
      }
      return helper.success(res, 'Notification list', responseList);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },


}