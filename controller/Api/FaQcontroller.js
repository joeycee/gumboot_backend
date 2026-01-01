const helper = require('../../Helper/helper')
let FaQ_model = require('../../model/Admin/FaQ_model')


module.exports = {

    faq_listing: async(req, res)=> {
        try {
            const faqData = await FaQ_model.find()

            if (!faqData){
                return helper.failed(res, "Something went wrong", faqData)
            }
            
            return helper.success(res, "FAQ list", faqData)
        } catch (error) {
            console.log(error)
        }
    }


}