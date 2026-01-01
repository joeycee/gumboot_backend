let user_model = require('../../model/Admin/user_model')
let helper = require('../../Helper/helper')

module.exports = {

    profile_swap_list: async(req, res) => {
        try {
            let title = "profile_swap_list"
            let userList = await user_model.find({ role: [1,2]});
            userList = userList.filter((data) => {
                return data.user_To_Worker == 1 || data.worker_To_User == 1;
            })

            res.render('Admin/profile_swap/profile_swap_list', {title, userList, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
           console.log(error) 
        }
    },



}