let addCost_model = require('../../model/Admin/addCost_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper');
let user_model = require('../../model/Admin/user_model')
const job_request = require('../../model/Admin/job_request')


module.exports = {

    
    add_additional_cost: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                amount: "required",
                description: "required",
                jobId: "required" // Assuming jobId is required
            });
    
            const values = await v.check(); // Check validation
            if (!values) {
                return helper.failed(res, v.errors);
            }
    
            let imgdata = [];
    
            if (req.files && req.files.image) {
                if (Array.isArray(req.files.image)) {
                    for (const image of req.files.image) {
                        imgdata.push(helper.imageUpload(image, "images") );
                    }
                } else {
                    const image = req.files.image;
                    imgdata.push(helper.imageUpload(image, "images") );
                }
            }
            req.body.image = imgdata;

            const addCost = await addCost_model.create({
                workerId: req.user.id,
                jobId: req.body.jobId,
                image: req.body.image ,
                amount: req.body.amount,
                description: req.body.description,
                });
    
            return helper.success(res, "Additional cost uploaded successfully", addCost);
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    additional_cost_list: async (req, res) => {
        try {
        
            const workerId = req.user._id; // Assuming _id is the worker's ID
            
            const costList = await addCost_model.find({ workerId });

            if (!costList) {
                return helper.failed(res, "Something went wrong");
            }
            
            return helper.success(res, "Additional Cost List", costList);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Something went wrong");
        }
    }

}