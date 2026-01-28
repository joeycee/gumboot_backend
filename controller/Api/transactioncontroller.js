const transactionModel = require('../../model/Admin/transaction_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper');
const user_model = require('../../model/Admin/user_model');
const job_model = require('../../model/Admin/job_model');
let addCost_model = require('../../model/Admin/addCost_model')
let serviceFees = require('../../model/Admin/service_fee_model')
let notification_model = require('../../model/Admin/notification_model')

module.exports = {

  payment_transaction: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        transactionId: "required",
        jobId: "required"
      })

      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }
      let userId = req.user._id;
      const transactionstatus = await transactionModel.create({
        userId,
        ...req.body
      })

      let jobId = transactionstatus.jobId;
      const jobData = await job_model.findById({ _id: jobId })  // job price

      const addCostData = await addCost_model.findOne({ jobId });  // add cost
      let addCosts = addCostData ? addCostData.amount : "0"

      const adminfee = await serviceFees.findOne()  //admin fees

      let workerFinalAmount = jobData.price;
      if (addCosts && jobData.price) {
        jobPrice_addCost = Number(addCosts) + Number(jobData.price)  //job price with add cost
        adminCharges = (Number(jobData.price)) * adminfee.service_charge / 100;   //admin charges
        workerFinalAmount = Number(addCosts) + Number(jobData.price) - adminCharges;   // worker final amount
      }

      // Update admin wallet
      const admin = await user_model.findOne({ role: '0' });
      if (admin) {
        const currentWallet = parseFloat(admin.wallet_amount || 0);
        const updatedWallet = currentWallet + adminCharges;
        
        await user_model.updateOne(
          { _id: admin._id },
          { wallet_amount: updatedWallet }
        );

        const worker = await user_model.findById(jobData.workerId);

        if (worker) {
            const currentWalet = parseFloat(worker.wallet_amount || 0);
            const updateworkerWallet = currentWalet + req.body.amount;
          
          await user_model.updateOne(
            { _id: worker._id },
            { wallet_amount: updateworkerWallet }
          );
        }

      }

      const sender = await user_model.findOne({ _id: userId });      
      const receiver = await user_model.findById(jobData.workerId);

      if (receiver && receiver.device_token) {
        let payload = {};
        payload = sender;
        payload.title = "Payment Sent";
        payload.message = `${sender.firstname} has sent the payment (this may take a few days)`;
        payload.jobId = jobId;
        payload.workerId = receiver._id

        let save_noti_data = {};
        save_noti_data.receiver = receiver._id;
        save_noti_data.sender = sender._id;
        save_noti_data.type = 1;
        save_noti_data.jobId = jobId;
        save_noti_data.message = payload.message;

        await notification_model.create(save_noti_data);
        
        let objS = {
          device_type: receiver.device_type,
          device_token: receiver.device_token,
          sender_name: sender.firstname,
          sender_image: sender.image,
          message: payload.message,
          workerId: receiver._id,
          type: 5,
          payload,
          save_noti_data
        }

        await helper.send_push_notification(objS);
      }

      return helper.success(res, "Transactions", { transactionstatus, jobPrice_addCost, workerFinalAmount, adminCharges })
    } catch (error) {
      console.log(error)
    }
  },

  transaction_list: async (req, res) => {
    try {
      const userId = req.user._id
      let usertransaction = await transactionModel.find({ userId: userId }).sort({ createdAt: -1 })
        .populate("userId", 'firstname image')
        .populate("jobId", 'job_title price workerId')

      if (!usertransaction) {
        return helper.failed(res, "Transaction not found");
      }

      return helper.success(res, 'User transaction list', usertransaction);
    } catch (error) {
      console.log(error)
    }
  },

  job_cancellation_charges: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await user_model.findOne({ _id: userId });

      if (!user) {
        return helper.failed(res, "User not found");
      }

      if (user.user_job_cancellation_fee === "0") {
        return helper.success(res, "User has not cancelled any job");
      } else {
        const cancellationCount = parseInt(user.user_job_cancellation_fee);
        return helper.success(res, `User has cancelled ${cancellationCount} job${cancellationCount !== 1 ? 's' : ''}`, user);
      }
    } catch (error) {
      return helper.failed(res, "Something went wrong");
    }
  },

  // worker_transaction_history: async (req, res) => {
  //   try {
  //     const workerId = req.user._id;

  //     const jobs = await job_model.find({ workerId, job_status: '7' });

  //     if (!jobs || jobs.length == 0) {
  //       return helper.error2(res, 'No jobs found for the worker.');
  //     }

  //     const modifiedTransactions = [];   // Initialize an array to store modified transactions

  //     for (const job of jobs) {

  //       const addCost = await addCost_model.findOne({ jobId: job });   // Find additional cost for the job
  //         let add_Cost =   addCost ? addCost.amount : "0"

  //       const adminfee = await serviceFees.findOne();  // Find admin fee
  //       console.log(adminfee, ">>>>>>>>>>>>>>>>adminfee>>>>>");

  //       const adminCharges = (Number(job.price)) * adminfee.service_charge / 100;   // Calculate admin charges
  //       console.log(adminCharges, ">>>>>>>>>>>>>>adminCharges>>>>>>>");

  //       const jobTransaction = await transactionModel.findOne({ jobId: job }).populate("jobId", "job_title price");
  //       console.log(jobTransaction, ">>>>>>>>>>>>>>>>jobTransaction>>>>>");

  //       const workerFinalAmount = add_Cost ? (Number(add_Cost) + Number(job.price) - adminCharges) : null;
  //       console.log(workerFinalAmount, ">>>>>>>>>>>>>>>workerFinalAmount>>>>>");

  //       const modifiedTransaction = {
  //         jobTransaction,
  //         jobPrice: jobs.price,
  //         add_Cost: add_Cost,
  //         adminCharges,
  //         workerFinalAmount
  //       };

  //       modifiedTransactions.push(modifiedTransaction);  // Push the modified transaction to the array
  //     }

  //     return helper.success(res, 'Worker transaction list', modifiedTransactions);
  //   } catch (error) {
  //     console.error(error);
  //     return helper.error(res, 'An error occurred while fetching worker transaction history.');
  //   }
  // }

  worker_transaction_history: async (req, res) => {
    try {
      const workerId = req.user._id;

      const jobs = await job_model.find({ workerId, job_status: '7' });

      if (!jobs || jobs.length == 0) {
        return helper.error2(res, 'No jobs found for the worker.');
      }

      const modifiedTransactions = []; // Initialize an array to store modified transactions
      let totalWalletAmount = 0; // Initialize total wallet amount

      for (const job of jobs) {
        const addCost = await addCost_model.findOne({ jobId: job }); // Find additional cost for the job
        let add_Cost = addCost ? addCost.amount : "0";

        const adminfee = await serviceFees.findOne(); // Find admin fee

        const adminCharges = (Number(job.price)) * adminfee.service_charge / 100; // Calculate admin charges

        const jobTransaction = await transactionModel.findOne({ jobId: job }).populate("jobId", "job_title price image")
          .populate('userId', 'firstname image');

        const workerFinalAmount = add_Cost ? (Number(add_Cost) + Number(job.price) - adminCharges) : null;

        if (workerFinalAmount !== null) {
          totalWalletAmount += workerFinalAmount; // Add workerFinalAmount to total wallet amount
        }

        const modifiedTransaction = {
          jobTransaction,
          jobPrice: job.price,
          add_Cost: add_Cost,
          adminCharges,
          workerFinalAmount
        };

        modifiedTransactions.push(modifiedTransaction); // Push the modified transaction to the array
      }

      return helper.success(res, 'Worker transaction list', { modifiedTransactions, total_wallet_amount: totalWalletAmount });
    } catch (error) {
      console.error(error);
      return helper.error(res, 'An error occurred while fetching worker transaction history.');
    }
  }


}
