let cms_model = require('../../model/Admin/cms_model')
let helper = require('../../Helper/helper')

module.exports = {

  about_us: async(req, res)=> {
        try {

            const data = await cms_model.findOne({role:1})
           if (!data) {
            return helper.failed(res, "Something went wrong", data)
           }
           return helper.success(res, "About us", data)
        } catch (error) {
            console.log(error)
        }
  },

  terms_conditions: async(req, res)=> {
        try {

            const data = await cms_model.findOne({role:2})
            if (!data) {
                return helper.failed(res, "Something went wrong", data)
               }
               return helper.success(res, "Terms And conditions", data)

        } catch (error) {
            console.log(error)
        }
  },

  privacy_Policy: async(req, res)=> {
        try {

            const data = await cms_model.findOne({role:3})
            if (!data) {
            return helper.failed(res, "Something went wrong", data)
           }
           return helper.success(res, "Privacy policy", data)
        } catch (error) {
            console.log(error)
        }
  },


}