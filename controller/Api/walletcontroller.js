const { Validator } = require('node-input-validator');
const wallet = require('../../model/Admin/wallet_model');
const helper = require('../../Helper/helper')
const job_model = require('../../model/Admin/job_model');
let addCost_model = require('../../model/Admin/addCost_model')
let serviceFees = require('../../model/Admin/service_fee_model')

module.exports = {

    wallet_transaction: async(req, res)=> {
        try {
           
            let workerId = req.user._id;
            const walletTransaction = await wallet.create({
               workerId,
                ...req.body
            })

            return helper.success(res, "Transaction status", walletTransaction)
        } catch (error) {
           console.log(error) 
        } 
    }


}