let withdraw_requests = require('../../model/Admin/withdraw_requests')
let banks = require('../../model/Admin/bankmodel');
let users = require('../../model/Admin/user_model')
const helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');

module.exports = {
  withdrawRequest: async (req, res) => {
    try {
      const v = new Validator(req.body, {

        bank_id: "required",
        amount: "required",
      });

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }
      //   Find bank account for the user
      const bankData = await banks.findOne({ workerId: req.user._id });
      if (!bankData) {
        return res.status(400).json({ success: false, message: "No bank account found. Please add a bank account to proceed." });
      }

      //   Get user data
      const userData = await users.findById(req.user._id);
      if (!userData) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const requestAmount = parseFloat(req.body.amount);
      if (isNaN(requestAmount)) {
        return res.status(400).json({ success: false, message: "Invalid amount entered" });
      }

      if (userData.wallet_amount < requestAmount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }

      // Create withdraw request
      const withdrawRequestData = await withdraw_requests.create({
        userId: req.user._id,
        bank_id: req.body.bank_id,
        amount: req.body.amount,
        status: '0',
      });

      return res.status(200).json({
        success: true,
        message: "Withdraw request created successfully",
        data: withdrawRequestData
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  withdrawList: async (req, res) => {
    try {
      let userId = req.user._id;

      let withdrawData = await withdraw_requests
        .find({ userId })
        .populate({
          path: 'userId',
          select: 'firstname lastname image email'
        })
        .sort({ createdAt: -1 });

      if (!withdrawData) {
        return helper.failed(res, "No Request Found for this")
      }

      return helper.success(res, "Withdraw Request List:", withdrawData)

    } catch (error) {
      throw error
    }
  }


}