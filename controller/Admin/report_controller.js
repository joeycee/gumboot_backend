const report_model = require('../../model/socket/reportrequest')

module.exports = {


    report_request: async (req, res) => {
        try {
          
            let reporting = await report_model.create({
                reportTo: req.body.reportTo,
                reportBy: req.body.reportBy,
                message: req.body.message,
                })
                // req.flash("msg", " created successfully")
                // res.redirect('/report_list')
                res.json(reporting)
    
        } catch (error) {
            console.log(error)
        }
    },

    report_list: async (req, res) => {

        try {
            title = "report_list"
            let reportData = await report_model.find().populate("reportTo").populate("reportBy");

            res.render('Admin/report/report_list', {title, reportData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    view_report: async(req, res)=> {
        try {
            let title = "report_list"
            let repoData = await report_model.findById({_id: req.params.id}).populate("reportTo").populate("reportBy")
            res.render('Admin/report/view_report', { title, repoData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    delete_report: async(req, res)=> {
        try {
            let reportId = req.body.id;
            const removereport = await report_model.deleteOne({_id: reportId})
            res.redirect('/report_list')

        } catch (error) {
            console.log(error)
        }
    }


}
