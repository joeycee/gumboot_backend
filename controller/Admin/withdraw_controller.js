let withdraw_requests = require('../../model/Admin/withdraw_requests')
let users = require('../../model/Admin/user_model')
let banks = require('../../model/Admin/bankmodel');
const notification_model = require('../../model/Admin/notification_model');

let helper = require('../../Helper/helper');


module.exports = {
    withdraw_list: async (req, res) => {
        try {
            let title = "withdraw_list";

            let withdrawData = await withdraw_requests
                .find()
                .populate('userId')
                .sort({ createdAt: -1 });

            // console.log(withdrawData,"???????????????????????????");


            res.render('Admin/withdraws/withdrawList', {
                title,
                withdrawData,
                session: req.session.user,
                msg: req.flash('msg')
            });
        } catch (error) {
            console.log(error);
        }
    },

    withdrawView: async (req, res) => {
        try {

            let title = "withdraw_list";
            if (!req.session.user) return res.redirect('/logIn');

            // Get the withdraw request with user details
            const withdrawData = await withdraw_requests.findById(req.params.id)
                .populate({
                    path: 'userId',
                    select: 'firstname lastname',
                    model: 'user'
                })
                .populate({
                    path: 'bank_id',
                    select: 'account_name bank_name account_number',
                    model: 'bank'
                })
                .lean();

            if (!withdrawData) {
                req.flash("error", "Withdraw request not found");
                return res.redirect("/admin/withdraw-requests");
            }

            //  bank details associated with the same user
            const bankDetails = await banks.findOne({
                workerId: withdrawData.userId._id,
                deleted: false
            }).lean();

            withdrawData.bankDetails = bankDetails;


            console.log(withdrawData,"??????????????????????????????????");
            

            res.render("Admin/withdraws/withdrawView", {
                title,
                 withdrawData,
                session: req.session.user,
                msg: req.flash("msg"),
                error: req.flash("error"),
            });

        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    },



    WithdrawStatusUpdate: async (req, res) => {
        try {
            const { id, status } = req.body;

            const numericStatus = parseInt(status);

            if (![0, 1, 2].includes(numericStatus)) {
                return res.status(400).json({ success: false, message: "Invalid status value." });
            }

            const currentRequest = await withdraw_requests.findById(id);
            if (!currentRequest) {
                return res.json({ success: false, message: "Withdraw request not found." });
            }

            if (currentRequest.status == 1 || currentRequest.status == 2) {
                return res.json({
                    success: false,
                    message: "Status cannot be changed once it is Approved or Rejected."
                });
            }

            if (numericStatus == 1) {
                const user = await users.findById(currentRequest.userId);
                // const admin = await users.findOne({_id:req.session.user._id})
                if (!user) {
                    return res.json({ success: false, message: "User not found." });
                }
            
                const withdrawAmount = parseFloat(currentRequest.amount || 0);
                const currentWallet = parseFloat(user.wallet_amount || 0);
                // const adminCurrentWallet = parseFloat(admin.wallet_amount || 0);
    
                if (currentWallet < withdrawAmount) {
                    req.flash('msg', "Insufficient wallet balance.");
                    return res.json({ success: false, message: "Insufficient wallet balance." });
                }
            
                user.wallet_amount = currentWallet - withdrawAmount;
                // admin.wallet_amount=adminCurrentWallet - withdrawAmount
                await user.save();
                // await admin.save();
            }
            

            // Update the withdrawal request status
            currentRequest.status = numericStatus;
            await currentRequest.save();


            // Send push notification
        let notificationMessage = '';
        if (numericStatus == 1) {
            notificationMessage = 'Your withdrawal request has been Approved.';
        } else if (numericStatus == 2) {
            notificationMessage = 'Your withdrawal request has been Rejected.';
        }

        if (numericStatus == 1 || numericStatus == 2) {
            const user = await users.findById(currentRequest.userId);
            const admin = await users.findOne({role:'0'})
            const payLoad = {
                device_token: user.device_token,
                message: notificationMessage,
                type: 7,
                sender_name: "Admin",
                workerId: user._id.toString(),
                save_noti_data: {
                    jobId: id 
                }
            };

            await helper.send_push_notification(payLoad); // Make sure this is properly imported or defined

            // Save notification in DB
             await notification_model.create({
                sender: admin._id,
                receiver: user._id,
                jobId: id, 
                message: notificationMessage,
                type: 7,
                status: 0 
            });
        }



            req.flash('msg', 'Status Updated Successfully');
            return res.json({ success: true, message: 'Status Updated Successfully' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }



}