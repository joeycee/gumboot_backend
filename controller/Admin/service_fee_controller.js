const service_fee = require('../../model/Admin/service_fee_model')
let helper = require('../../Helper/helper')

module.exports = {

add_service_fee: async(req, res) => {
    try {

        let adminId = req.session.user;
        const addservice_fee = await service_fee.create({
            // service_fee: req.body.service_fee,
            service_charge: req.body.service_charge
        })
        return helper.success(res, "fdvhbfdhvb", addservice_fee)
    } catch (error) {
       console.log(error) 
    }
},

serviceFee_list: async(req, res)=> {
    try {
        let title = "serviceFee_list"
        const serviceFee = await service_fee.find()
        res.render('Admin/serviceFees/serviceFee_list', {title, serviceFee, session: req.session.user, msg: req.flash('msg') })
        
    } catch (error) {
        console.log(error)
    }
},

edit_serviceFee: async(req, res)=> {
    try {
        let title = "serviceFee_list"
        const serviceFeeData = await service_fee.findOne({})
        res.render('Admin/serviceFees/edit_serviceFee', {title, serviceFeeData, session: req.session.user, msg: req.flash('msg') })
    } catch (error) {
        console.log(error) 
    }
},

update_serviceFee: async(req, res)=> {  
    try {
            const updatedservice = await service_fee.updateOne({_id: req.body._id },
                {                
                // service_fee: req.body.service_fee,
                service_charge: req.body.service_charge 
            });

            req.flash("msg", "Updated successfully")
            res.redirect('/serviceFee_list')
    } catch (error) {
        console.log(error)
    }
}



}