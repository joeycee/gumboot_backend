
let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');

module.exports = { 


  create_category: async (req, res) => {
        try {

            const v = new Validator(req.body, {
                name: "required",
            });

            const value = JSON.parse(JSON.stringify(v));
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            if (req.files && req.files.image) {
                var image = req.files.image;

                if (image) {
                    req.body.image = helper.imageUpload(image, "images");
                }
            }
            let user = await category_model.create({
                image: req.body.image,
                name: req.body.name
            })
            return helper.success(res, "Category created successfully", user);

        } catch (error) {
        console.log(error)
        }
  },

  category_list: async(req, res)=> {                   //filter screen work categories
    try {
        let jobtypelist = await category_model.find()

        if (!jobtypelist) {
            return helper.failed(res, "Something went wrong");    
        }

        return helper.success(res, "Category list", jobtypelist);
        
    } catch (error) {
        console.log(error)
    }

  },

}