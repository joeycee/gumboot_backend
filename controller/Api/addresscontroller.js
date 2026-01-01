
const address_model = require('../../model/Admin/address_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')
let csc = require('country-state-city').default;
let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

// const admin = require('firebase-admin');
// const serviceAccount = require('./../../Helper/jobbie-25911-firebase-adminsdk-zx2nx-5e0f4068ce.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

module.exports = {

  add_address: async (req, res) => {
    try {
      
      const v = new Validator(req.body, {
        address: "required",
        // city: "required",
        // country: "required",
        // street: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      let time = helper.unixTimestamp();
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
      // userId = req.user._id
      let address = await address_model.create({
        
        ...req.body
      })

      if (!address) {
        return helper.failed(res, "Failed to add address")
      }
      return helper.success(res, "Address added succesfully", address);
    } catch (error) {
      console.log(error)
    }
  },

  edit_address: async (req, res) => {

    try {
      const v = new Validator(req.body, {
        // mobile_number: "required",
        // full_name: "required",
        // city: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      // let time = helper.unixTimestamp();
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };

      const addressId = req.body.addressId
      delete req.body.latitude
      delete req.body.longitude

      const address = await address_model.updateOne(
        { _id: req.body.addressId },
        { ...req.body }
      );
      if (!address) {
        return helper.failed(res, "Address not found");
      }

      const updatedaddress = await address_model.findOne({ _id: req.body.addressId })
      return helper.success(res, "Address updated", updatedaddress);

    } catch (error) {
      return helper.failed(res, "Error updating address");
    }
  },

  select_address: async (req, res) => {
    try {

      const userId = req.user._id

      let useraddress = await address_model.find({ userId: userId, deleted: false }).sort({ createdAt: -1 });

      if (!useraddress) {
        return helper.failed(res, "Address not found");
      }

      return helper.success(res, 'User address list', useraddress);
    } catch (error) {
      console.log(error)
    }
  },

  delete_address: async (req, res) => {
    try {
      let addressId = req.body.addressId;
      let removeaddress = await address_model.findByIdAndUpdate({ _id: addressId }, { deleted: true })

      if (!removeaddress) {
        return helper.failed(res, "Address not found")
      }

      return helper.success(res, "Address removed successfully ", removeaddress)

    } catch (error) {
      console.log(error)
    }
  },

  citystatecountry: async (req, res) => {
    try {

      let count = await Country.getAllCountries()
      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `Listing fetched successfully.`, count);
    } catch (err) {
      return helper.error(res, err);
    }
  },

  getState: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        countrycode: 'required'
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      let city = await State.getStatesOfCountry(req.body.countrycode);
      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `Listing fetched successfully.`, city);
    } catch (err) {
      return helper.error(res, err);
    }
  },

  getCity: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        countrycode: 'required',
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      let city;
      if (req.body.countrycode && req.body.statecode) {
        city = City.getCitiesOfState(req.body.countrycode, req.body.statecode)
      } else {
        city = City.getCitiesOfCountry(req.body.countrycode)
      }

      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `Listing fetched successfully.`, city);
    } catch (err) {
      return helper.error(res, err);
    }
  },

  // test_notification: async (req, res) => {
  //   try {
  //     const message = {
  //       token:"fGBoUi-4SXerUF5Anyzl7b:APA91bET-9lSfO-N_2-CogBuq2Ylx3HaPKb-Nu3WXByS2dgiOPnUCVHueJJpCqpxk4U_z2EOtjkWHSj29TkiNyYPCJlhP22u5J6215pqSVEJo7AiIR1_Ryo8Hk9vdpwZE3KMueP_veB2",
  //       notification: {
  //           title: "Gumboot",
  //           body: "JHB", // Ensure this is a string
  //       },
  //       data: {
  //           title: "Gumboot",
  //           body: "test", // Ensure this is a string
  //           content_available: "true", // This should be a string
  //           priority: "high", // This should be a string
  //           jobId: "hfgdhs", // Ensure this is a string
  //           notificationType: "sdcxas", // Ensure this is a string
  //           sender_name: "SDA", // Ensure this is a string
  //       },
  //   };
  //   admin.messaging().send(message)
  //           .then((response) => {
  //               console.log('Successfully sent message:', response);
  //           })
  //           .catch((error) => {
  //               console.log('Error sending message:', error);
  //           });
  //     return
  //   } catch (err) {
  //     return helper.error(res, err);
  //   }
  // },






}