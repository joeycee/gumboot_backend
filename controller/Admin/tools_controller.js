const tools_model = require('../../model/Admin/tools_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')


module.exports = {

    addToolsPage: async(req, res)=> {
        try {
            let title = "tools_listing"
            res.render('Admin/tools/addToolsPage', { title, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

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

           res.redirect("/tools_listing")

        } catch (error) {
            console.log(error)
        }
    },

    tools_listing: async(req, res)=> {
        try {
            title = "tools_listing"
        const toolslist = await tools_model.find().sort({createdAt:-1})
            res.render('Admin/tools/tools_listing', {title, toolslist, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    view_tools: async(req, res)=> {
        try {
            let title = "tools_listing"
            let toolsData = await tools_model.findById({_id: req.params.id})
            res.render('Admin/tools/view_tools', { title, toolsData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    edit_tools: async(req, res)=> {
        try {
            let title = "tools_listing"
            let editData = await tools_model.findById({_id: req.params.id})
            res.render('Admin/tools/edit_tools', { title, editData,  session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    update_tools: async(req, res)=> {
        try {
            
            let user = await tools_model.updateOne({_id: req.body.id},
                {
                    tool_name: req.body.tool_name,

                } );
                req.flash("msg", "Updated successfully")
                res.redirect('/tools_listing')
                
            } catch (error) {
                console.log(error)
            }
    },

    delete_tools: async(req, res)=> {
        try {
          let userid = req.body.id;
          let remove = await tools_model.deleteOne({_id: userid})
          res.redirect('/category_list')
          
        } catch (error) {
          console.log(error)
        }
    },

    tools_status: async (req, res) => {
        try {
          
        var check = await tools_model.updateOne(
          { _id: req.body.id },
          { status: req.body.value }
        );
        
        req.flash("msg", "Status update successfully");
          
        if (req.body.value == 0) res.send(false);
        if (req.body.value == 1) res.send(true);
    
        } catch (error) {
          console.log(error)
        }
    },

    

    
}