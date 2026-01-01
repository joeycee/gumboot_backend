
let user_model = require('../../model/Admin/user_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');
const review_model = require('../../model/Admin/review_model');
const job_request = require('../../model/Admin/job_request');
const cardmodel = require('../../model/Admin/cardmodel')
const servicefee = require('../../model/Admin/service_fee_model')
let bankmodel = require('../../model/Admin/bankmodel')

module.exports = {

  id_verification: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bio: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let error = await helper.checkValidation(v);

      if (error) {
        return helper.failed(res, error);
      }

      // Upload image
      let imagedata = "";
      let IdproofImage = "";
      if (req.files && req.files.selfie) {
        imagedata = await helper.imageUpload(req.files.selfie, "images");
      }
      if (req.files && req.files.idproof) {
        IdproofImage = await helper.imageUpload(req.files.idproof, "images");
      }

      userId = req.user._id;

      let data = await user_model.findById(userId);

      // Assuming 'tools' is an array of tools names in the request body
      const tools = req.body.tools;
      const skill = req.body.skill;

      let adddocument = await user_model.updateOne(
        { _id: userId },
        {
          selfie: imagedata ? imagedata : "",
          idproof: IdproofImage ? IdproofImage : "",
          bio: req.body.bio,
          skill: req.body.skill ? req.body.skill.split(",") : [],
          tools: req.body.tools ? req.body.tools.split(",") : [],
        });

      const findUserData = await user_model.findOne({ _id: userId }).populate("skill").populate("tools").lean();

      let userCard = await cardmodel.findOne({ userId: findUserData._id });

      findUserData.is_card = userCard ? 1 : 0;

      return helper.success(res, "Details uploaded successfully", findUserData);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "An error occurred while processing the request");
    }
  },

  profile: async (req, res) => {
    try {
      const userId = req.user.id;
      // Find the user's profile data
      const profiledata = await user_model.findById(userId).populate("skill").populate("tools");

      if (!profiledata) {
        return helper.error(res, "User not found");
      }
      // Calculate the average rating of login profile
      const ratings = await review_model.find({ workerId: userId });

      const count = ratings.length;
      const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);

      const averageRating = count > 0 ? totalRating / count : 0;

      return helper.success(res, "User Profile", { profiledata, ratingdata: { count, averageRating } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  edit_profile: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        // firstname: "required",
        // lastname: "required",
        // phone: "required",
        // bio: "required",

      });
      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      if (req.files && req.files.image) {
        var image = req.files.image;

        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }
      const object = req.body
      let editdata = await user_model.updateOne({ _id: req.user.id },
        object);

      let editdatas = await user_model.findById(req.user.id);
      if (editdata) {
        return helper.success(res, "Profile updated successfully", editdatas)
      }

    } catch (error) {
      console.log(error)
    }
  },

  jobsCompletedbyWorker: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;

      const v = new Validator(req.body, {
        workerId: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      const skip = (page - 1) * perPage;

      const findcompletedjob = await job_request.find({ workerId: req.body.workerId, job_status: "7" }).skip(skip).limit(perPage).populate("jobId")
        .populate({
          path: 'jobId',
          populate: [
            { path: 'job_type', model: 'category', select: 'name image' }, 
            { path: 'servicefee', model: 'service_fee', select: 'service_fee service_charge' }
        ]
       });

      const totalJobsCount = await job_request.countDocuments();
      const totalPages = Math.ceil(totalJobsCount / perPage);

      if (!findcompletedjob) {
        return helper.failed(res, "Something went wrong")
      }
      return helper.success(res, "jobs completed by worker", {
        findcompletedjob,
        page: page,
        perPage: perPage,
        totalPages: totalPages
      })
    } catch (error) {
      console.log(error)
    }
  },

  jobsRequestedbyWorker: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        jobId: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
  
      const findJobRequests = await job_request.find({ jobId: req.body.jobId }).populate("workerId");
  
      if (!findJobRequests || findJobRequests.length === 0) {
        return helper.failed(res, "No job requests found for the specified job ID");
      }
      const adminChagres = await servicefee.findOne()

      let admin_charges = adminChagres.service_charge;
  
      const responseList = [];
  
      for (const jobRequest of findJobRequests) {
        const workerId = jobRequest.workerId;
  
        const workerAvgRatings = await review_model.find({ workerId: workerId, rater_role: "1" });
  
        // Calculate the average rating for the worker
        let totalRating = 0;
        let count = 0;
  
        workerAvgRatings.forEach((review) => {
          // Ensure that review.rating is treated as a number
          totalRating += Number(review.rating);
          count += 1;
        });
  
        const averageRating = count > 0 ? totalRating / count : 0;
  
        const workerResponse = {
          jobRequest: jobRequest,
           admin_charges,
          workerAvgRating: parseFloat(averageRating.toFixed(2)),
        };
  
        responseList.push(workerResponse);
      }
  
      return helper.success(res, "Jobs requested by worker", responseList);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },

  role_change: async (req, res) => {
    try {
      const v = new Validator(req.body, {
          role: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      const object = req.body
      let updaterole = await user_model.updateOne({ _id: req.user.id },
      object);

      // Update user_To_Worker and worker_To_User fields based on the role
      let updateFields = {};
      if (req.user.role == 1) {
        updateFields = { $set: { user_To_Worker: 1, worker_To_User: 0 } };
      } else {
        updateFields = { $set: { worker_To_User: 1, user_To_Worker: 0 } };
      }
      const updateRole = await user_model.updateOne({ _id: req.user.id }, updateFields);
    
      const account = await bankmodel.count({ workerId: req.user.id});
      let updatedrole = await user_model.findById(req.user.id);
      let obj = {
        updatedrole,
        account
      }

      return helper.success(res, "Role updated successfully", obj);
    } catch (error) {
      console.log(error)
    }
  },

  worker_public_profile: async (req, res) => {
    try {
      const v = new Validator(req.query, {
        workerId: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
  
      const workerId = req.query.workerId;
      const workerDetails = await user_model.findOne({ _id: workerId }).populate("skill").populate("tools");
  
      if (!workerDetails) {
        return helper.failed(res, "Worker details not found");
      }
  
      // Find admin charges
      const adminCharges = await servicefee.findOne();
      let admin_charges = adminCharges.service_charge;
  
      // Initialize offerPrice with admin_charges
      let offerPrice = { admin_charges };
  
      // Check if jobrequestedId is provided
      if (req.query.jobrequestedId) {
        const workerOfferPrice = await job_request.findOne({ _id: req.query.jobrequestedId, workerId: workerDetails._id });
        // Add other properties if workerOfferPrice exists
        if (workerOfferPrice) {
          offerPrice.message = workerOfferPrice.message;
          offerPrice.offered_price = workerOfferPrice.offered_price;
        }
      }
  
      // Fetch completed jobs by the worker
      const completedJobs = await job_request.find({ workerId: workerId, job_status: "7" })
      .limit(5)
      .sort({createdAt:-1})
      .populate({
        path: 'jobId',
        populate: [
          { path: 'job_type', model: 'category', select: 'name image' },
          { path: 'servicefee', model: 'service_fee', select: 'service_fee service_charge' }
        ]
      });
  
      // Fetch ratings for the worker
      const ratings = await review_model.find({ workerId, rater_role: "1" });
      const count = ratings.length;
      const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
      const averageRating = count > 0 ? totalRating / count : 0;
  
      return helper.success(res, "Worker details", {
        workerDetails,
        offerPrice,
        ratingdata: { count, averageRating },
        completedJobs: completedJobs
      });
    } catch (error) {
      console.log(error);
      return helper.failed(res, "An error occurred");
    }
  },
  
  



}