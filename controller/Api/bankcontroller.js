let bankmodel = require('../../model/Admin/bankmodel')
let user_model = require('../../model/Admin/user_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')

module.exports = {

  add_bank: async (req, res) => {
    try {
      const v = new Validator(req.body, {

        account_name: "required",
        bank_name: "required",
        account_number: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      let bankData = await bankmodel.findOne({ account_number: req.body.account_number, });
      if (bankData) {
        return helper.failed(res, "This Account Already Exists , Please Add Another Account");
      }

      userId = req.user._id
      let addbank = await bankmodel.create({

        workerId: req.user._id,
        account_name: req.body.account_name,
        bank_name: req.body.bank_name,
        account_number: req.body.account_number,
      })

      if (!addbank) {
        return helper.failed(res, "Unable to add bank account", addbank)
      }

      return helper.success(res, "Bank account added successfully", addbank)

    } catch (error) {
      console.log(error)
    }
  },

  edit_bank: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        Id: "required",
        account_name: "required",
        bank_name: "required",
        account_number: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      const _id = req.body.Id

      let editbank = await bankmodel.updateOne({ _id }, {

        account_name: req.body.account_name,
        bank_name: req.body.bank_name,
        account_number: req.body.account_number,

      })

      const updatedbank = await bankmodel.findOne({ _id: _id })
      return helper.success(res, "Bank details updated successfully", updatedbank)

    } catch (error) {
      console.log(error)
    }
  },

  bank_list: async (req, res) => {
    try {

      let banklist = await bankmodel.find({ workerId: req.user.id, deleted: false })

      if (!banklist) {
        return helper.failed(res, "No bank account available", banklist)
      }

      return helper.success(res, "Bank list", banklist)
    } catch (error) {
      console.log(error)
    }
  },

  delete_bank: async (req, res) => {
    try {
      let bankId = req.body.id;
      let remove = await bankmodel.findByIdAndUpdate({ _id: bankId }, { deleted: true })

      // console.log(remove); 

      if (remove.length == 0) {
        return helper.failed(res, "Something went wrong", remove)
      }

      return helper.success(res, "Bank details removed successfully ", remove)

    } catch (error) {
      console.log(error)
    }
  },

  set_default_bank: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bankId: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      const { bankId } = req.body;
      const userId = req.user._id;

      const findbank = await bankmodel.findOne({ _id: bankId });

      if (!findbank) {
        return helper.failed(res, "The bank ID provided is invalid.");
      }

      let editBank = await bankmodel.updateOne(
        { _id: bankId },
        { default: 1 }
      );

      await bankmodel.updateMany(
        { workerId: userId, _id: { $ne: bankId } },
        { default: 0 }
      );

      const updatedBank = await bankmodel.findOne({ _id: bankId });

      return helper.success(res, "Set default bank successfully", updatedBank);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "An error occurred while setting the default bank.");
    }
  }


}