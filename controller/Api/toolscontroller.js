const tools_model = require('../../model/Admin/tools_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')


module.exports = {

  add_tools: async(req, res)=> {
        try {
            const v = new Validator(req.body, {
                tool_name: "required",
              });

              let error = await helper.checkValidation(v);
              if (error) {
                return helper.failed(res, error);
              }

            let addtools = await tools_model.create({
                tool_name: req.body.tool_name
            })

            return helper.success(res, " Tools added successfully", addtools)

        } catch (error) {
            console.log(error)
        }
  },

  tools_list: async(req, res)=> {                 
        try {
            let toolsList = await tools_model.find()
    
            if (!toolsList) {
                return helper.failed(res, "Something went wrong");    
            }
    
            return helper.success(res, "Tools list", toolsList);
            
        } catch (error) {
            console.log(error)
        }
    
  },

    
}