let support_model = require('../../model/Admin/support_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');


module.exports = {
    
  support: async(req, res)=> {
        try {
            const v = new Validator(req.body, {
                name: "required",
                mobile_number: "required", 
                email: "required",
                message: "required"
            });

            let error = await helper.checkValidation(v);
            if (error){
                return helper.failed(res, error);
            }

            // const userId = req.user._id
            
            let support = await support_model.create({ 
                userId: req.body.userId,
                name: req.body.name,
                mobile_number: req.body.mobile_number,
                email: req.body.email,
                message: req.body.message
            })

            if (!support) {
                return helper.failed(res, "Unable to add support", support)
            }

            return helper.success(res, "Message send successfully", support)

        } catch (error) {
            console.log(error)
        }

  }


}