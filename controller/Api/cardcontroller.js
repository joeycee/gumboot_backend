let cardmodel = require('../../model/Admin/cardmodel')
let cardLink_model = require('../../model/Admin/cardLink_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');
const { token } = require('morgan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

module.exports = {

    add_card: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                card_number: "required",
                expire_year: "required",
                expire_month: "required",
                cvv: "required"
            });
            
            const values = JSON.parse(JSON.stringify(v));
            let errorsResponse = await helper.checkValidation(v);
            
            if (errorsResponse) {
                return helper.failed(res, errorsResponse);
            }
            
            const card_number = await cardmodel.findOne({
                card_number: req.body.card_number,
                userId: req.user.id, deleted:false
            });

            if (card_number) {
                return helper.failed(res, "Card already exists");
            }
            const cardToken = await helper.stripeToken(req);

            let createCard = await cardmodel.create({
                userId: req.user.id,
                cardHolder_name: req.body.cardHolder_name,
                card_number: req.body.card_number,
                expire_year: req.body.expire_year,
                expire_month: req.body.expire_month,
                cvv: req.body.cvv,
                card_token: cardToken

            });

            if (!createCard) {
                return helper.failed(res, "Something went wrong")
            }

            return helper.success(res, "Card Added successfully", createCard)

        } catch (error) {
            return helper.error(res, "Invalid card number / details");
        }
    },

    edit_card: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                cardHolder_name: "required",
                card_number: "required",
                expire_year: "required",
                expire_month: "required",
                cvv: "required"
            });

            const values = JSON.parse(JSON.stringify(v));
            let errorsResponse = await helper.checkValidation(v);

            if (errorsResponse) {
                return helper.failed(res, errorsResponse);
            }

            let _id = req.body.cardId;

            const checkCard = await cardmodel.findById({ _id });

            if (!checkCard) {
                return helper.failed(res, "Card not found");
            }

            let updateCard = await cardmodel.updateOne({ _id }, {
                cardHolder_name: req.body.cardHolder_name,
                card_number: req.body.card_number,
                expire_year: req.body.expire_year,
                expire_month: req.body.expire_month,
                cvv: req.body.cvv
            });

            if (!updateCard) {
                return helper.failed(res, "Something went wrong", updateCard)
            }

            const updatedcard = await cardmodel.findOne({_id: req.body.cardId})

            return helper.success(res, "Card updated successfully", updatedcard)

        } catch (error) {
            return helper.error(res, error);
        }
    },

    delete_card: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                cardId: "required",
            });

            const values = JSON.parse(JSON.stringify(v));
            let errorsResponse = await helper.checkValidation(v);

            if (errorsResponse) {
                return helper.failed(res, errorsResponse);
            }

            const removecard = await cardmodel.findByIdAndUpdate({ _id: req.body.cardId}, {deleted: true})

            if (!removecard) {
                return helper.failed(res, "Card not found");
            }
            return helper.success(res, "Card removed successfully", removecard);
        } catch (error) {
            console.log(error)
        }
    },

    card_list: async (req, res) => {
        try {

            const userId = req.user._id
            const cardList = await cardmodel.find({ userId: userId, deleted: false });

            if (!cardList) {
                return helper.failed(res, 'No card found', cardList);
            }
            return helper.success(res, 'Saved cards', cardList);
            
        } catch (error) {
            console.log(error);
        }
    },

    jobPayment: async (req, res) => {
        try {
        const errors = await bookTableValidator(req, res);
        if (!errors.isEmpty()) return res.status(400).json({
        success: 0,
        code: 400,
        message: errors.array().map(err => err.msg)
        })
        const { restaurentId, tableId, date, bookingStartTime, totalMember, paymentMethod, total } = req.body;
        const bookingData = await booking.create({
        userId: req.user._id,
        restaurentId: restaurentId,
        tableId: tableId,
        date: date,
        bookingStartTime: bookingStartTime,
        totalMember: totalMember,
        paymentMethod: paymentMethod,
        total: total
        });
        
        const stripePayment = await stripeController.stripePayment(bookingData);
        
        return helper.success(res, "Payment Url", stripePayment.url);
        } catch (error) {
        helper.failed(res, error.message);
        }
    },

    add_card_link: async(req, res)=> {
        try {

            let create = await cardLink_model.create({
    
                title: req.body.title,
                description: req.body.description,
            })
    
            // res.json({create})
            return helper.success(res, "Card Added successfully", create)

        } catch (error) {
            console.log(error)
        }
    },

    card_link: async(req, res)=> {
        try {
            const whycardrequired = await cardLink_model.findOne()

            if (!whycardrequired) {
                return helper.failed(res, "Details not found")
            }
            
            return helper.success(res, "Why card required", whycardrequired)
        } catch (error) {
            console.log(error)
        }
    }




}