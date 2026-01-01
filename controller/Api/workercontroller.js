
let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper');
const job_model = require('../../model/Admin/job_model');
const job_request = require('../../model/Admin/job_request');
const review_model = require('../../model/Admin/review_model');

module.exports = {

  skillList: async (req, res) => {
    try {
      const skillList = await category_model.find();

      if (!skillList) {
        return helper.failed(res, "Something went wrong", skillList);
      }

      return helper.success(res, "Skill list", skillList);

    } catch (error) {
      console.log(error);
    }
  },

  applications: async (req, res) => {
    try {
      const { jobId } = req.query;

      if (jobId) {
        const jobData = await job_request.find({ jobId }).populate("workerId", "firstname bio image");

        if (!jobData) {
          return helper.failed(res, 'No workers applied for this job')
        }
        const ratings = await review_model.find({ rater_role: "1" })
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = count > 0 ? totalRating / count : 0;

        return helper.success(res, 'Workers applied for job', { jobData, ratingdata: { count, averageRating } });

      } else {
        // If jobId is not provided, return the list of all jobs with requestedIds
        const jobsData = await job_request.find().populate("workerId", "firstname bio image");

        if (!jobsData) {
          return helper.failed(res, 'Something went wrong');
        }
        const ratings = await review_model.find({ rater_role: "1" })
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = count > 0 ? totalRating / count : 0;

        return helper.success(res, 'Jobs listing', { jobsData, ratingdata: { count, averageRating } });
      }
    } catch (error) {

      console.error(error);
      return helper.failed(res, 'An error occurred');
    }
  },

  update_Job_Status: async (req, res) => {
    try {
      const userId = req.user._id;
      const job_id = req.body.job_id;
      const status = req.body.status;

      // Define a map of status codes to messages
      const statusMessages = {
        0: 'open job request',    //default status is 0
        1: 'job applied by worker',
        2: 'job pending by user',
        3: 'Job accepted',
        4: 'job on going',
        5: "job rejected",
        6: "job completed"
      };
      // Find and update the job request status
      const completedJob = await job_request.findOneAndUpdate(
        { _id: job_id },
        { status: status }
      );

      // Get the message based on the status
      const msg = statusMessages[status] || 'Unknown status';

      // Determine the receiver ID based on the job status
      let receiverId = null;
      if (status !== 4) {
        receiverId = completedJob.userId;
      } else {
        receiverId = completedJob.workerId;
      }

      // Create a notification object
      const notifi = {
        sender: userId,
        receiver: receiverId,
        message: msg,
        type: 1
      };

      // Find the user to get device information for push notification
      const user = await user_model.findById(receiverId);

      // Create push notification data
      if (user && user.device_token) {
        const pushNoti = {
          device_token: user.device_token,
          device_type: user.device_type,
          type: status, // You can customize the push notification type as needed
          message: msg
        };

        // Send push notification
        await helper.sendPushNotification(pushNoti);
      }

      // Create a notification in your system
      const notification = await helper.notificationData(notifi);

      // Handle additional logic based on status
      if (status === 1) {
        // Update the job status to 3 (assuming 3 represents a completed job)
        await job_model.findOneAndUpdate({ _id: completedJob.jobId }, { status: 3 });
        // Perform payment processing logic here if needed
      }

      return helper.success(res, 'Job user_job_listing updated successfully', { msg });
    } catch (error) {
      console.error(error);
      return helper.failed(res, 'Something went wrong', error);
    }
  },

  user_public_profile: async (req, res) => {
    try {
      const v = new Validator(req.query, {
        userId: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      const userId = req.query.userId

      const userDetail = await user_model.findOne({ _id: userId }).populate("skill").populate("tools")

      if (!userDetail) {
        return helper.failed(res, "User details not found")
      }

      const ratings = await review_model.find({ userId })
      const count = ratings.length;
      const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
      const averageRating = count > 0 ? totalRating / count : 0;

      //find completed and new jobs
      const completedJobs = await job_model.find({ userId, job_status: "7" })
      .sort({createdAt:-1})
      .populate('job_type')
      .populate('servicefee', 'service_fee service_charge');

      const newJobs = await job_model.find({ userId, job_status: "0" })
      .sort({createdAt:-1})
      .populate('job_type')
      .populate('servicefee', 'service_fee service_charge');

      return helper.success(res, "User details", { userDetail, ratingdata: { count, averageRating }, completedJobs, newJobs });

    } catch (error) {
      console.log(error)
    }
  },

  worker_job_requests: async (req, res) => {
    try {
      const workerId = req.user.id;
      const workerJobRequested = await job_request.find({ workerId: workerId, job_status: "1" })
        .populate({
          path: 'jobId',
          populate: {
            path: 'job_type',
            model: 'category'
          }
        })
        .sort({ _id: -1 });

      if (!workerJobRequested) {
        return helper.failed(res, "Something went wrong");
      }

      return helper.success(res, "Jobs requested by worker", workerJobRequested);
    } catch (error) {
      console.log(error);
    }
  },

  completedAndNewJobs: async (req, res) => {
    try {
      let workerId = req.user.id;
      const v = new Validator(req.body, {
        userId: "required",
        // job_status: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      const userId = req.body.userId;
      const jobStatusFilter = req.body.job_status;

      // Create a filter object based on the provided job_status
      const statusFilter = jobStatusFilter ? { job_status: jobStatusFilter } : {};

      // Find jobs based on userId and job_status filter
      const jobs = await job_model.find({ userId, ...statusFilter }).populate("job_type").populate('servicefee', 'service_fee service_charge');;

      // Find job requests by workerId and jobId(s) in the jobs array
      const jobRequests = await job_request.find({ workerId: workerId, jobId: { $in: jobs.map(job => job._id) } });

      // Add a property to each job indicating whether the worker has requested it
      const jobsWithRequests = jobs.map(job => {
        const request = jobRequests.find(request => request.jobId.equals(job._id));
        const hasRequested = !!request; // Check if there is a request for the current job
        const requestId = hasRequested ? request._id : null; // Capture the request ID if exists
        return { ...job.toObject(), workerHasRequested: hasRequested, requestId };
      });

      if (!jobsWithRequests || jobsWithRequests.length === 0) {
        return helper.failed(res, 'No jobs found with the specified criteria');
      }

      return helper.success(res, 'Job list', { jobs: jobsWithRequests });
    } catch (error) {
      console.log(error);
      return helper.failed(res, 'An error occurred while processing the request');
    }
  },

  // worker_job_listing: async (req, res) => {
  //   try {
  //     // const workerId = req.user._id;
  //     const workerId = req.query.workerId;
  //     const page = req.query.page || 1;
  //     const perPage = req.query.perPage || 10;
  //     const date = req.query.date; // Date in format 'day-month-year'
  //     const jobStatus = req.query.job_status;

  //     // Build the filter object based on query parameters
  //     const filter = { deleted: false };

  //     if (req.query.search) {
  //       filter.job_title = { $regex: req.query.search, $options: 'i' };
  //     }

  //     if (req.query.job_type) {
  //       filter.job_type = req.query.job_type;
  //     }

  //     if (date) {
  //       const currentDate = new Date();
  //       filter.exp_date = { $in: date }
  //       // filter.exp_date = { $gte: currentDate }
  //     } else {
  //      const currentDate = new Date();
  //       currentDate.setUTCHours(0, 0, 0, 0);
  //       filter.exp_date = { $gte: currentDate };
  //     }
      
  //     // Exclude jobs where the worker's ID matches the userId in the job
  //   filter.userId = { $ne: workerId };

  //     if (!jobStatus) {
  //       // If no job_status filter is provided, include jobs with workerId null and exclude job_status 7
  //       filter.$or = [
  //         { workerId: null },
         
  //         { $and: [{ workerId: workerId }, { job_status: { $ne: "7" }} ] },
  //       ];
  //     } else if (jobStatus == '7') {
  //       // If job_status is 7, fetch job reviews for completed jobs
  //       const completedJobs = await job_model.find({ job_status: '7', workerId }) .populate('servicefee', 'service_fee service_charge');

  //       // Fetch job reviews for completed jobs
  //       const jobReviewData = await Promise.all(completedJobs.map(async (job) => {
  //         const jobReviews = await review_model.find({ jobId: job._id });
  //         return {
  //           ...job._doc,
  //           jobReviews
  //         };
  //       }));
        
  //       return helper.success(res, "Completed Jobs listing with Job Reviews", {
  //         jobs: jobReviewData,
  //         page: page,
  //         perPage: perPage,
  //         totalJobsCount: jobReviewData.length, // Use the count of completed jobs with reviews
  //         totalPages: Math.ceil(jobReviewData.length / perPage) // Calculate totalPages based on the count
  //       });
  //     } else {
  //       // If job_status filter is provided and not 7, exclude jobs with job_status 7
  //       filter.job_status = { $ne: "7" };
  //     }
  //     // Query the database to count the total number of jobs matching the filter
  //     const totalJobsCount = await job_model.countDocuments(filter);
  //     // Calculate the items to skip
  //     const skip = (page - 1) * perPage;

  //     // Query the database with pagination and filters
  //     const jobsData = await job_model.find(filter)
  //       .populate("job_type")
  //       .populate('servicefee', 'service_fee service_charge')
  //       .populate('address')
  //       .skip(skip)
  //       .limit(perPage)
  //       .sort({ createdAt: -1 });

  //     if (!jobsData) {
  //       return helper.failed(res, "Jobs not found");
  //     }

  //     // Function to calculate user rating count and average rating
  //     const calculateUserRating = async (userId) => {
  //       const ratings = await review_model.find({ userId, rater_role: "2" });
  //       const count = ratings.length;
  //       const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
  //       const averageRating = count > 0 ? totalRating / count : 0;
  //       return { count, averageRating };
  //     };

  //     // Iterate through jobsData to add jobRequestedData and user rating data to each job object
  //     const jobsWithRequestedData = await Promise.all(jobsData.map(async (job) => {
  //       const jobRequestData = await job_request.findOne({ jobId: job._id });

  //       // Calculate the user rating count and average rating for the user
  //       const userRatingData = await calculateUserRating(job.userId);

  //       return {
  //         ...job._doc,
  //         jobRequestedData: jobRequestData,
  //         userRatingData
  //       };
  //     }));

  //     return helper.success(res, "Jobs listing", {
  //       jobs: jobsWithRequestedData,
  //       page: page,
  //       perPage: perPage,
  //       totalJobsCount: totalJobsCount,
  //       totalPages: Math.ceil(totalJobsCount / perPage)
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return helper.failed(res, "Internal server error");
  //   }
  // },

  addImageByWorker: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        jobId: "required",
        type: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
  
      const imgArr = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
      const imgdata = imgArr.map(image => ({ url: helper.imageUpload(image, "images") }));
  
      const fieldToUpdate = req.body.type === "1" ? "image_before_job" : "image_after_job";
  
      const jobId = req.body.jobId;
      const updateField = { $push: { [fieldToUpdate]: { $each: imgdata } } };
  
      const addImage = await job_model.findByIdAndUpdate({ _id: jobId }, updateField, { new: true });
      const addedImage = await job_model.find({ _id: jobId });
  
      return helper.success(res, "Images uploaded successfully", addedImage);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },

  worker_job_listing: async (req, res) => {
    try {
      // const workerId = req.user._id;
      const workerId = req.query.workerId;
      const page = req.query.page || 1;
      const perPage = req.query.perPage || 10;
      const date = req.query.date; // Date in format 'day-month-year'
      // const is_loggedIn = req.query.is_loggedIn ? req.query.is_loggedIn : 0
      // Build the filter object based on query parameters
      const filter = { 
        deleted: false,
        job_status: { $ne: "7" } // Exclude jobs with job_status '7'
      };
  
      if (req.query.search) {
        filter.job_title = { $regex: req.query.search, $options: 'i' };
      }
  
      if (req.query.job_type) {
        filter.job_type = req.query.job_type;
      }

      if (date) {
        const currentDate = new Date();
        filter.exp_date = { $in: date };
      } else {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);
        filter.exp_date = { $gte: currentDate };
          filter.job_status = "0"; // Add condition to filter/show jobs with job_status "0"

            // Get job IDs where the worker has already applied
        const jobRequests = await job_request.find({ workerId });
        const appliedJobIds = jobRequests.map(jobRequest => jobRequest.jobId);
  
        // // Exclude jobs where the worker has already applied
        filter._id = { $nin: appliedJobIds };
      }
      
      // Exclude jobs where the worker's ID matches the userId in the job
      if(workerId){
        filter.userId = { $ne: workerId };
      }
  
      // Query the database to count the total number of jobs matching the filter
      const totalJobsCount = await job_model.countDocuments(filter);
      // Calculate the items to skip
      const skip = (page - 1) * perPage;      
  
      // Query the database with pagination and filters
      const jobsData = await job_model.find(filter)
        .populate("job_type")
        .populate('servicefee', 'service_fee service_charge')
        .populate('address')
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });
  
      if (!jobsData) {
        return helper.failed(res, "Jobs not found");
      }
  
      // Function to calculate user rating count and average rating
      const calculateUserRating = async (userId) => {
        const ratings = await review_model.find({ userId, rater_role: "2" });
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
        const averageRating = count > 0 ? totalRating / count : 0;
        return { count, averageRating };
      };
  
      // Iterate through jobsData to add jobRequestedData and user rating data to each job object
      const jobsWithRequestedData = await Promise.all(jobsData.map(async (job) => {
        const jobRequestData = await job_request.findOne({ jobId: job._id });
  
        // Calculate the user rating count and average rating for the user
        const userRatingData = await calculateUserRating(job.userId);
  
        return {
          ...job._doc,
          jobRequestedData: jobRequestData,
          userRatingData
        };
      }));
  
      return helper.success(res, "Jobs listing", {
        jobs: jobsWithRequestedData,
        page: page,
        perPage: perPage,
        totalJobsCount: totalJobsCount,
        totalPages: Math.ceil(totalJobsCount / perPage)
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error");
    }
  },

  worker_completed_jobs: async (req, res) => {
    try {
      const workerId = req.query.userId;   

      // Query the database with pagination and filters
      const jobsData = await job_model.find( {workerId: workerId, deleted: false, job_status: "7"})
        .populate("job_type")
        .populate('servicefee', 'service_fee service_charge')
        .populate('address')
        .sort({ createdAt: -1 });
        
      if (!jobsData) {
        return helper.failed(res, "Jobs not found");
      }

      // Exclude jobs where the worker's ID matches the userId in the job
      jobsData.userId = { $ne: workerId };
  
      // Function to calculate user rating count and average rating
      const calculateUserRating = async (userId) => {
        const ratings = await review_model.find({ userId, rater_role: "2" });
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
        const averageRating = count > 0 ? totalRating / count : 0;
        return { count, averageRating };
      };
  
      // Iterate through jobsData to add jobRequestedData and user rating data to each job object
      const jobsWithRequestedData = await Promise.all(jobsData.map(async (job) => {
        const jobRequestData = await job_request.findOne({ jobId: job._id });
  
        // Calculate the user rating count and average rating for the user
        const userRatingData = await calculateUserRating(job.userId);
  
        return {
          ...job._doc,
          jobRequestedData: jobRequestData,
          userRatingData
        };
      }));
  
      return helper.success(res, "Jobs listing", {
        jobs: jobsWithRequestedData,
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error");
    }
  },

  jobs_listing: async (req, res) => {
    try {
      const workerId = req.user._id;
      const page = req.query.page || 1;
      const perPage = req.query.perPage || 10;
      const date = req.query.date;

      const filter = { 
        // workerId: workerId,
        $or: [
          { workerId: workerId },
          { userId: workerId }
        ],
        deleted: false,
        job_status: { $ne: "7" }
      };

      if (date) {
        const currentDate = new Date();
        filter.exp_date = { $in: date };
      } else {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);
        filter.exp_date = { $gte: currentDate };
          filter.job_status = "0";

        // Get job IDs where the worker has already applied
        const jobRequests = await job_request.find({ workerId });
        const appliedJobIds = jobRequests.map(jobRequest => jobRequest.jobId);
  
        // // Exclude jobs where the worker has already applied
        filter._id = { $nin: appliedJobIds };
      }
      
      // Exclude jobs where the worker's ID matches the userId in the job
      // if(workerId){
      //   filter.userId = { $ne: workerId };
      // }
  
      // Query the database to count the total number of jobs matching the filter
      const totalJobsCount = await job_model.countDocuments(filter);
      // Calculate the items to skip
      const skip = (page - 1) * perPage;      
  
      // Query the database with pagination and filters
      const jobsData = await job_model.find(filter)
        .populate("job_type")
        .populate('servicefee', 'service_fee service_charge')
        .populate('address')
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });
  
      if (!jobsData) {
        return helper.failed(res, "Jobs not found");
      }
  
      // Function to calculate user rating count and average rating
      const calculateUserRating = async (userId) => {
        const ratings = await review_model.find({ userId, rater_role: "2" });
        const count = ratings.length;
        const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
        const averageRating = count > 0 ? totalRating / count : 0;
        return { count, averageRating };
      };
  
      // Iterate through jobsData to add jobRequestedData and user rating data to each job object
      const jobsWithRequestedData = await Promise.all(jobsData.map(async (job) => {
        const jobRequestData = await job_request.findOne({ jobId: job._id });
  
        // Calculate the user rating count and average rating for the user
        const userRatingData = await calculateUserRating(job.userId);
  
        return {
          ...job._doc,
          jobRequestedData: jobRequestData,
          userRatingData
        };
      }));
  
      return helper.success(res, "Jobs listing", {
        jobs: jobsWithRequestedData,
        page: page,
        perPage: perPage,
        totalJobsCount: totalJobsCount,
        totalPages: Math.ceil(totalJobsCount / perPage)
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error");
    }
  },


}