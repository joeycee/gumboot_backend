const jobInterest = require('../../model/Admin/job_interest')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');

module.exports = {

  jobInterested: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        workerId: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      userId = req.user._id
      let addjobinterest = await jobInterest.create({
        userId,
        workerId: req.body.workerId,
        status: req.body.status,
        type: req.body.type
      })

      return helper.success(res, "Added successfully", addjobinterest)

    } catch (error) {
      console.log(error)
    }
  },

  ReConnectJob_listing: async (req, res) => {
    try {
      const userId = req.user._id;

      const jobInterestedData = await jobInterest.find({userId}).populate('workerId', 'firstname image bio role')

      if (!jobInterestedData) {
        return helper.failed(res, "Something went wrong")
      }
      return helper.success(res, "Interested in jobs again", jobInterestedData);

    } catch (error) {
      console.error(error);
      return helper.failed(res, "Something went wrong");
    }
  },

  updatejobInterested: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        jobinterestId: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      const jobinterestId = req.body.jobinterestId

      const addjobinterest = await jobInterest.updateOne({ _id: jobinterestId },
        {
          status: req.body.status,
          type: req.body.type
        })

      const updatedinterest = await jobInterest.findOne({ _id: req.body.jobinterestId })

      return helper.success(res, "Added successfully", updatedinterest)

    } catch (error) {
      console.log(error)
    }
  },

  deleteInterest: async (req, res) => {
    try {
      interestId = req.body.interestId
      const removedetails = await jobInterest.deleteOne({ _id: interestId })

      if (!removedetails) {
        return helper.failed(res, "Something went wrong")
      }
      return helper.success(res, "Deleted successfully")

    } catch (error) {
      console.log(error)
    }
  }


}