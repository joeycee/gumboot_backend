let helper = require('../../Helper/helper');
const { Validator } = require('node-input-validator');
const job_model = require('../../model/Admin/job_model');
const job_request = require('../../model/Admin/job_request')
const category_model = require('../../model/Admin/category_model')
const address_model = require('../../model/Admin/address_model');
const notification_model = require('../../model/Admin/notification_model');
const user_model = require('../../model/Admin/user_model');
const review_model = require('../../model/Admin/review_model')
const addCost_model = require('../../model/Admin/addCost_model');
const { default: mongoose } = require('mongoose');
var postmark = require("postmark");

module.exports = {

    add_job: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                job_title: "required",
                job_type: "required",
                address: "required",
                description: "required",
                price: "required",
                exp_date: "required",
                est_time: "required"
            });
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }
            let imgdata = [];
            if (req.files && req.files.image && Array.isArray(req.files.image))
                for (i in req.files.image) {
                    let image = req.files.image[i];
                    imgdata.push({ url: helper.imageUpload(image, "images") });
                }
            else {
                req.files && req.files.image;
                let image = req.files.image;
                imgdata.push({ url: helper.imageUpload(image, "images") });
            }
            req.body.image = imgdata;

            if (req.body.longitude && req.body.latitude) {
                req.body.location = {
                    type: "Point",
                    coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
                };
                req.body.latitude = Number(req.body.latitude);
                req.body.longitude = Number(req.body.longitude);
            } else {
                // Default coordinates
                req.body.location = {
                    type: "Point",
                    coordinates: [0, 0], // Default coordinates
                };
                req.body.latitude = 0;
                req.body.longitude = 0;
            }
            req.body.exp_date = new Date(req.body.exp_date);

            // userId = req.user._id;

            let jobs = await job_model.create({
                ...req.body
            })

            if (!jobs) {
                return helper.failed(res, "Unable to add job")
            }
            return helper.success(res, "job added successfully", jobs)
        } catch (error) {
            console.log(error)
        }
    },

    edit_job: async (req, res) => {
        try {
            let imgdata = [];
            if (req.files && req.files.image && Array.isArray(req.files.image)) {
                for (let i = 0; i < req.files.image.length; i++) {
                    let image = req.files.image[i];
                    imgdata.push({ url: helper.imageUpload(image, "images") });
                }
            } else if (req.files && req.files.image) {
                let image = req.files.image;
                imgdata.push({ url: helper.imageUpload(image, "images") });
            }

            const jobId = req.body.jobId;

            // Find the existing job
            const existingJob = await job_model.findOne({ _id: jobId });

            if (!existingJob) {
                return helper.failed(res, "Job not found");
            }

            // Update only the image array
            existingJob.image = [...existingJob.image, ...imgdata];

            // Save the updated job document
            const updatedJob = await existingJob.save();

            const jobid = req.body.jobId
            const editjobs = await job_model.updateOne(
                { _id: jobid },
                { ...req.body }
            );
            const updatedJobData = await job_model.findOne({ _id: jobId })

            return helper.success(res, "Job updated successfully", updatedJobData);
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    get_job_types: async (req, res) => {     //list of categories/job type
        try {
            const jobTypeList = await category_model.find()

            if (!jobTypeList) {
                return helper.failed(res, "something went wrong")
            }
            return helper.success(res, "job type listing", jobTypeList)
        } catch (error) {
            console.log(error)
        }
    },

    delete_job: async (req, res) => {
        try {
            let jobId = req.body.jobId;
            let removejob = await job_model.findByIdAndUpdate({ _id: jobId }, { deleted: true })

            if (!removejob) {
                return helper.failed(res, "job not found")
            }

            return helper.success(res, "job deleted successfully ", removejob)

        } catch (error) {
            console.log(error)
        }
    },

    completed_jobs: async (req, res) => {
        try {
            const userId = req.user._id;

            // Find completed jobs for the user
            const completedJobs = await job_model.find({ userId, job_status: 7 });

            if (!completedJobs) {
                return helper.failed(res, 'No completed job found', completedJobs);
            }

            // Find job reviews associated with the completed jobs
            const jobIds = completedJobs.map(job => job._id);
            const jobReviewData = await review_model.find({ jobId: { $in: jobIds } });

            // Create a dictionary to associate job reviews with their respective jobs
            const completedJobsWithReviews = completedJobs.map(job => {
                const reviewsForJob = jobReviewData.filter(review => review.jobId.equals(job._id));
                return {
                    ...job._doc,
                    reviews: reviewsForJob,
                };
            });

            return helper.success(res, 'Completed job list', {
                completedJobsWithReviews,
            });
        } catch (error) {
            console.log(error);
        }
    },

    job_cancel: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                jobId: "required",
            });

            const value = JSON.parse(JSON.stringify(v));
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobCancel = await job_model.updateOne({ _id: req.body.jobId },
                { status: '4' })

            if (!jobCancel) {
                return helper.failed(res, " something went wrong", jobCancel);
            }

            return helper.success(res, " job cancelled successfully", jobCancel);
        } catch (error) {

        }
    },

    jobAccToNameAndStatus: async (req, res) => {
        try {
            const jobName = req.body.jobName;
            const jobStatus = req.body.jobStatus;
            const job_type = req.body.job_type;
            const date = req.body.date; // Date in format 'day/month/year'

            // Create a query object
            const query = {};

            // If a job name is provided, add it to the query
            if (jobName) {
                query.job_title = { $regex: '^' + jobName, $options: 'i' };
            }

            // If a status is provided, add it to the query
            if (jobStatus) {
                query.status = jobStatus;
            }

            // If a category is provided, add it to the query
            if (job_type) {
                query.job_type = job_type;
            }

            // If a date is provided, parse it and create a date range filter
            if (date) {
                const [day, month, year] = date.split('/'); // Split the date string
                const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
                const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
                query.createdAt = { $gte: startDate, $lte: endDate };
            }

            // If neither name, status, nor type is provided, retrieve all jobs
            if (!jobName && !jobStatus && !job_type && !date) {
                const allJobs = await job_model.find({});
                return helper.success(res, "All jobs", allJobs);
            }

            const jobsList = await job_model.find(query);

            if (!jobsList || jobsList.length === 0) {
                return helper.failed(res, "No jobs found");
            }

            return helper.success(res, "Jobs according to search", jobsList);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "An error occurred");
        }
    },

    jobSearch: async (req, res) => {
        try {
            const data = await job_model.aggregate([
                {
                    $lookup: {

                        from: "jobs",
                        localField: "category",
                        foreignField: "job_type",
                        as: "job details"
                    },
                }
            ])
            res.json(data)

        } catch (error) {
            console.log(error)
        }
    },

    accept_Job: async (req, res) => {
        try {

            const jobId = req.body.jobId;

            const jobRequest = await job_request.findOne({

                _id: jobId,
                job_status: '1'     // Assuming status 1 represents worker requested for this job
            });

            if (!jobRequest) {
                return helper.failed(res, "Job request not found or already accepted/rejected");
            }

            const jobstatus = await job_request.updateOne({ jobId, job_status: '2' })

            // You can also send a notification to the job creator if needed
            const jobData = await job_model.findById(jobRequest.jobId);

            const notification = {
                sender: req.user.id,
                receiver: jobRequest.workerId,
                message: `${req.user.firstname} has accepted your job request`,
                type: 2 // You can define the type for an acceptance notification
            };

            await helper.notificationData(notification);

            // Return a success response
            return helper.success(res, "Job request accepted successfully", jobData);
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    applyjob: async (req, res) => {
        try {
            const workerId = req.user._id;
            const status = 1;
            const jobId = req.body.jobid;

            const existingRequest = await job_request.findOne({ workerId, jobId });

            if (existingRequest) {
                existingRequest.job_status = status;
                await existingRequest.save();

                // Update the job status in job_model
                await job_model.updateOne({ _id: jobId }, { job_status: status });

                return helper.success(res, "Job status updated successfully.", {
                    job_request_id: existingRequest._id, // Include the job_request id in the response
                });
            } else {
                const obj = {
                    ...req.body,
                    workerId,
                    status,
                    jobId,
                };
                const data = await job_request.create(obj);
                await job_model.updateOne({ _id: jobId }, { job_status: status });

                const jobdataa = await job_model.findById(jobId);
                // Find the user to get device information for push notification
                const user = await user_model.findById(jobdataa.userId);
                const sender = await user_model.findOne({ _id: req.user.id });
                const receiverId = await user_model.findOne({ _id: jobdataa.userId });

                let payload = {};
                payload = sender;
                payload.title = "Message Sent ";
                payload.message = `${sender.firstname} Has applied for your job`;
                payload.jobId = jobId;


                let save_noti_data = {};
                save_noti_data.receiver = receiverId;
                save_noti_data.sender = req.user.id;
                save_noti_data.type = 3;
                save_noti_data.jobId = jobId;
                save_noti_data.message = payload.message;

                await notification_model.create(save_noti_data);
                let objS = {
                    device_type: receiverId.device_type,
                    device_token: receiverId.device_token,
                    sender_name: sender.firstname,
                    sender_image: sender.image,
                    message: payload.message,
                    type: 3,
                    payload,
                    save_noti_data
                }

                await helper.send_push_notification(objS);
                return helper.success(res,
                    "Applied for job successfully.",
                    { data, job_request_id: data._id } // Include the job_request id in the response
                );
            }
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    delete_image: async (req, res) => {
        try {
            const jobId = req.body.id; // Assuming req.body.id is the job ID
            const imageId = req.body.imageId; // Assuming req.body.imageId is the image ID you want to delete

            // Find the job by ID
            const job = await job_model.findOne({ _id: jobId });

            if (!job) {
                return helper.failed(res, "Job not found");
            }

            // Use $pull to remove the image by its ID from the array
            job.image.pull(imageId);

            // Save the updated job document
            await job.save();

            const imageremoved = await job_model.findOne({ _id: jobId });

            return helper.success(res, "Image deleted successfully", imageremoved);

        } catch (error) {
            console.log(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    update_jobSource_location: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                jobId: "required",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobId = req.body.jobId
            const updatelocation = await job_model.updateOne({ _id: jobId },

                {
                    location: {
                        coordinates: [Number(req.body.longitude),
                        Number(req.body.latitude)],
                    }
                }
            );
            if (!updatelocation) {
                return helper.failed(res, "Something went wrong")
            }

            const updatedjoblocation = await job_model.findOne({ _id: req.body.jobId })

            return helper.success(res, "Location updated successfully", updatedjoblocation)

        } catch (error) {
            console.log(error)
        }
    },

    file_upload: async (req, res) => {
        try {
            const image = await helper.imageUpload(req.files.image, "images")
            return helper.success(res, 'Image upload successfully', { image });

        }
        catch (err) {
            console.log("err --------------- ", err)
            return res.status(400).json({ status: 0, message: "Something went wrong" });
        }
    },

    changeJobAddress: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                jobId: "required",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobId = req.body.jobId
            const jobaddress = await job_model.updateOne({ _id: jobId },
                { address: req.body.address })

            if (!jobaddress) {
                return helper.failed(res, "Something went wrong")
            }

            const updatedjobaddress = await job_model.findOne({ _id: req.body.jobId })

            return helper.success(res, "Job address updated successfully", updatedjobaddress)


        } catch (error) {
            console.log(error)
        }
    },

    user_job_listing: async (req, res) => {
        try {
            const userId = req.user._id;
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.perPage) || 10;
            const date = req.query.date; // Date in format 'day/month/year'
            const jobStatus = req.query.job_status;

            // Build the filter object based on query parameters
            const filter = { userId: userId, deleted: false };

            if (req.query.search) {
                filter.job_title = { $regex: req.query.search, $options: 'i' };
            }

            if (req.query.job_status) {
                filter.job_status = req.query.job_status;
            }

            if (req.query.job_type) {
                filter.job_type = req.query.job_type;
            }

            if (date) {
                const currentDate = new Date()
                filter.exp_date = { $in: date }
                // filter.exp_date = { $gte: currentDate }
            } else {
                const currentDate = new Date();
                currentDate.setUTCHours(0, 0, 0, 0);

                filter.exp_date = { $gte: currentDate };
            }
            
            // Calculate the items to skip
            const skip = (page - 1) * perPage;
            // Query the database with pagination and filters
            const jobsData = await job_model.find(filter)
                .populate("job_type")
                .populate('address')
                .populate('servicefee', 'service_fee service_charge')
                .skip(skip)
                .limit(perPage)
                .sort({ createdAt: -1 })
                .populate("userId", "firstname image");


            const totalJobsCount = await job_model.countDocuments(filter);
            const totalPages = Math.ceil(totalJobsCount / perPage);

            if (!jobsData) {
                return helper.failed(res, "No job found");
            }

            // If jobStatus is provided, filter jobs accordingly
            if (jobStatus) {
                if (jobStatus === '7') {
                    // If job_status is 7, fetch job reviews for completed jobs
                    const completedJobs = jobsData.filter(job => job.job_status === '7');

                    // Fetch job reviews for completed jobs
                    const jobReviewData = await Promise.all(completedJobs.map(async (job) => {
                        const jobReviews = await review_model.find({ jobId: job._id });
                        return {
                            ...job._doc,
                            jobReviews
                        };
                    }));

                    return helper.success(res, "Completed Jobs listing with Job Reviews", {
                        jobs: jobReviewData,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: totalJobsCount,
                        totalPages: totalPages
                    });
                } else {
                    // Filter jobs by the provided job_status
                    const filteredJobs = jobsData.filter(job => job.job_status === jobStatus);
                    return helper.success(res, "Jobs listing", {
                        jobs: filteredJobs,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: filteredJobs.length,
                        totalPages: Math.ceil(filteredJobs.length / perPage)
                    });
                }
            } else {
                // If jobStatus is not provided, exclude jobs with job_status '7'
                const jobsWithoutCompletedStatus = jobsData.filter(job => job.job_status !== '7');

                // Fetch jobRequestedData for all jobs
                const jobsWithRequestedData = await Promise.all(jobsWithoutCompletedStatus.map(async (job) => {
                    let filter = { jobId: job._id };
                    const jobRequestData = await job_request.find(filter);

                    return {
                        ...job._doc,
                        jobRequestedData: jobRequestData
                    };
                }));

                return helper.success(res, "Jobs listing", {
                    jobs: jobsWithRequestedData,
                    page: page,
                    perPage: perPage,
                    totalJobsCount: jobsWithoutCompletedStatus.length,
                    totalPages: Math.ceil(jobsWithoutCompletedStatus.length / perPage)
                });
            }
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    updateJobStatus: async (req, res) => {
        try {
            const userId = req.user._id;
            const jobRequested_id = req.body.jobRequested_id;
            const job_id = req.body.job_id;
            const job_status = req.body.job_status;

            const statusMessages = {
                0: 'Open job request',
                1: 'Applied for job',       // applied by worker & pending request from user
                2: 'Accepted the job',      // User can accept or user can update this status
                3: 'has started a job',     // worker can update this status
                4: 'denied job application',  // User can update this status
                5: 'Cancelled the job request',  // worker can update this status
                6: 'Has completed a job',   // worker can update this status
                7: 'Ended the job',         // user can update this status
                8: 'Start tracking',        // worker can update this status
                9: 'Reached on job location'    // worker can update this status
            };

            const statusMessage = {
                0: 'Open job request',
                1: 'Job applied successfully',       // applied by worker & pending request from user
                2: 'Job accepted successfully',      // User can accept or user can update this status
                3: 'Job has been started successfully',     // worker can update this status
                4: 'Job request has been rejected',  // User can update this status
                5: 'Job request has been cancelled ',  // worker can update this status
                6: 'Job has been completed successfully',   // worker can update this status
                7: 'Job has been ended',         // user can update this status
                8: 'Start tracking',        // worker can update this status
                9: 'Reached on job location'    // worker can update this status
            };

            const requestedJob = await job_request.findOneAndUpdate(
                { _id: jobRequested_id },
                { job_status: job_status }
            );

            let workerId = requestedJob.workerId;

            // if (job_status == 4 || job_status == 5) {
            //     workerId = null; 
            // }

            let users = await user_model.findById(userId);

            // Initialize user_job_cancellation_fee
            let user_job_cancellation_fee = users.user_job_cancellation_fee || 0;

            if (job_status == 4 && users.role == 1) {
                // Increment user_job_cancellation_fee by 1

                user_job_cancellation_fee = parseInt(user_job_cancellation_fee) + 1;

                // Update user_job_cancellation_fee
                await user_model.updateOne({ _id: userId }, { user_job_cancellation_fee });

                workerId = null; // Set workerId to null
            } else if (job_status == 5) {
                workerId = null;
            }

            const jobStatus = await job_model.findOneAndUpdate(
                { _id: job_id },
                {
                    job_status: job_status,
                    workerId: workerId
                }
            );

            const msg = statusMessages[job_status] || 'Unknown status';
            const msgs = statusMessage[job_status] || 'Unknown status';

            // if (job_status == 6) {
            //     // Add job price to worker's wallet_amount
            //     const worker = await user_model.findById(requestedJob.workerId);
            //     const jobData = await job_model.findById(job_id);

            //     if (worker && jobData && jobData.price) {
            //         const currentWallet = parseFloat(worker.wallet_amount || 0);
            //         const jobPrice = parseFloat(jobData.price);
            //         const updatedWallet = currentWallet + jobPrice;

            //         await user_model.updateOne(
            //             { _id: worker._id },
            //             { wallet_amount: updatedWallet }
            //         );
            //     }
            // }

            let receiverId = null;

            if (job_status == 2 || job_status == 4 || job_status == 7) {
                receiverId = requestedJob.workerId;
            } else if (job_status == 3 || job_status == 5 || job_status == 6 || job_status == 8 || job_status == 9) {
                receiverId = jobStatus.userId;
            }

            const user = await user_model.findById(receiverId);
            const sender = await user_model.findOne({ _id: req.user.id });
            const receiverObj = await user_model.findOne({ _id: receiverId });
            const jobdataa = await job_model.findById(job_id);

            if (user && user.device_token) {
                let payload = {};
                payload = sender;
                payload.title = "Message Sent ";
                payload.message = `${sender.firstname} ${msg}`;
                payload.jobId = job_id;
                payload.workerId = workerId

                const { device_token, device_type, type, firstname, image } = receiverObj;

                let save_noti_data = {};
                save_noti_data.receiver = receiverId;
                save_noti_data.sender = userId;
                save_noti_data.type = 1;
                save_noti_data.jobId = job_id;
                save_noti_data.message = payload.message;

                await notification_model.create(save_noti_data);
                
                let objS = {
                    device_type: receiverObj.device_type,
                    device_token: receiverObj.device_token,
                    sender_name: sender.firstname,
                    sender_image: sender.image,
                    message: payload.message,
                    workerId: workerId,
                    type: 1,
                    payload,
                    save_noti_data
                }

                await helper.send_push_notification(objS);
            }

            const createdAt = new Date(jobdataa.createdAt).toDateString();  // "Mon Mar 17 2025"
            const updatedAt = new Date(jobdataa.updatedAt).toDateString();  // "Fri Apr 18 2025"

            // Send email when job status is 7 (job completed)
            const worker = await user_model.findById(jobdataa.workerId);
            if (job_status == 7) {

                var client = new postmark.ServerClient("a6913d7e-021b-41e9-b470-30b264c0d1b5");

                let html = ` 
                        <!DOCTYPE html>
                            <html>

                            <head>
                                <title>Gumboot</title>
                                <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                                    rel="stylesheet">
                                
                                <style>
                                    * {
                                        padding: 0;
                                        margin: 0;
                                        font-family: 'Poppins', sans-serif;
                                        border-collapse: collapse;
                                    }

                                    .job-info {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        gap: 6px;
                                    }

                                    .job-id {
                                        text-align: right;
                                        margin-left: auto;
                                    }
                                </style>
                            </head>

                            <body>
                                <div style="max-width: 530px; width: 100%; margin: 14px auto;border-radius: 13px;box-shadow: 0px 0px 3px #ddd;box-sizing: border-box;">
                                    <div style="text-align: center;padding: 50px 30px;box-sizing: border-box;background: url(images/bg.png);">
                                        <img src="https://app.jobbie.co.nz/assets/img/logo.png" alt="" style="width: 220px;margin-bottom: 34px;">
                                        <h3 style="font-size: 27px;color: black;text-transform: uppercase;margin-top: 0px;margin-bottom: 19px;">
                                            Hello ${worker.firstname}, </h3>
                                        <p style="padding: 0px 0 0px;color: black;opacity: .5;font-size: 13px;margin-bottom: 10px;display: inline-block;">
                                            We are happy to inform you that <br>
                                            your job has been completed successfully.
                                        </p>
                                        <div style="display: flex;justify-content: space-between;padding: 15px;box-sizing: border-box;background: #f1f1f1;border-radius: 12px;margin: 20px 0px;">
                                            <div style="color: black; text-align: left; font-size: 13px;">
                                                <p class="job-info">
                                                    <span><i class="ph ph-arrow-right"></i> JobId:</span>
                                                    <span class="job-id">${job_id}</span>
                                                </p>
                                                <p class="job-info">
                                                    <span>Job Title:</span>
                                                    <span class="job-id">${jobdataa.job_title}</span>
                                                </p>
                                                <p class="job-info">
                                                    <span><i class="ph ph-arrow-right"></i> User Name:</span>
                                                    <span class="job-id">${users.firstname}</span>
                                                </p>
                                                <p class="job-info">
                                                    <span><i class="ph ph-arrow-right"></i> Price:</span>
                                                    <span class="job-id">${jobdataa.price}</span>
                                                </p>
                                                <p class="job-info">
                                                    <span>Job Status:</span>
                                                    <span class="job-id">Completed</span>
                                                </p>
                                                <p class="job-info">
                                                    <span><i class="ph ph-arrow-right"></i> Start Date:</span>
                                                    <span class="job-id">${new Date(jobdataa.createdAt).toDateString()}</span>
                                                </p>
                                                <p class="job-info">
                                                    <span>End Date:</span>
                                                    <span class="job-id">${new Date(jobdataa.updatedAt).toDateString()}</span>
                                                </p>

                                                <span><i class="ph ph-arrow-right"></i> Job Images:</span>
                                                <p style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                                                    <span style="text-align: right; margin-left: auto;">
                                                        ${jobdataa.image_after_job && Array.isArray(jobdataa.image_after_job) 
                                                            ? jobdataa.image_after_job.map(image => `
                                                                <a href="https://app.jobbie.co.nz/${image.url}" target="_blank" style="display: inline-block; margin-right: 6px;">
                                                                    <img src="https://app.jobbie.co.nz/${image.url}" alt="Job Image" style="max-width: 100px; max-height: 100px; object-fit: cover; cursor: pointer;" />
                                                                </a>
                                                            `).join('') 
                                                            : '<span>No images available</span>'
                                                        }
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <h4 style="margin-top: 20px;display: inline-block;"> Thank you for using Gumboot.</h4>
                                        <h5 style="font-size: 15px;font-weight: normal;">Best Regards,</h5>
                                        <h6 style="color: #1f98be;font-weight: normal;font-size: 15px;margin-top: 6px;margin-bottom: 60px;">The Gumboot Team</h6>

                                    </div>
                                </div>
                            </body>
                    </html>
                `;

                client.sendEmail({
                    From: 'joe@jobbie.co.nz',
                    To: worker.email,
                    Subject: 'Job completed',
                    HtmlBody: html,
                    TextBody: 'Gumboot',
                    MessageStream: 'outbound'
                }).then((response) => {
                    console.log('Email sent:', response.MessageID);
                }).catch((error) => {
                    console.error('Unable to send email:', error);
                });

                let html2 = ` 

                <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Gumboot</title>
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                            rel="stylesheet">
                        
                        <style>
                            * {
                                padding: 0;
                                margin: 0;
                                font-family: 'Poppins', sans-serif;
                                border-collapse: collapse;
                            }

                            .job-info {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                gap: 6px;
                            }

                            .job-id {
                                text-align: right;
                                margin-left: auto;
                            }
                        </style>
                    </head>

                    <body>
                        <div style="max-width: 530px; width: 100%; margin: 14px auto;border-radius: 13px;box-shadow: 0px 0px 3px #ddd;box-sizing: border-box;">
                            <div style="text-align: center;padding: 50px 30px;box-sizing: border-box;background: url(images/bg.png);">
                                <img src="https://app.jobbie.co.nz/assets/img/logo.png" alt="" style="width: 220px;margin-bottom: 34px;">
                                <h3 style="font-size: 27px;color: black;text-transform: uppercase;margin-top: 0px;margin-bottom: 19px;">
                                    Hello ${users.firstname}, </h3>
                                <p style="padding: 0px 0 0px;color: black;opacity: .5;font-size: 13px;margin-bottom: 10px;display: inline-block;">
                                    We are happy to inform you that <br>
                                    your job has been completed successfully.
                                </p>
                                <div style="display: flex;justify-content: space-between;padding: 15px;box-sizing: border-box;background: #f1f1f1;border-radius: 12px;margin: 20px 0px;">
                                    <div style="color: black; text-align: left; font-size: 13px;">
                                        <p class="job-info">
                                            <span><i class="ph ph-arrow-right"></i> JobId:</span>
                                            <span class="job-id">${job_id}</span>
                                        </p>
                                        <p class="job-info">
                                            <span>Job Title:</span>
                                            <span class="job-id">${jobdataa.job_title}</span>
                                        </p>
                                        <p class="job-info">
                                            <span><i class="ph ph-arrow-right"></i> Service Provider:</span>
                                            <span class="job-id">${worker.firstname}</span>
                                        </p>
                                        <p class="job-info">
                                            <span><i class="ph ph-arrow-right"></i> Price:</span>
                                            <span class="job-id">${jobdataa.price}</span>
                                        </p>
                                        <p class="job-info">
                                            <span>Job Status:</span>
                                            <span class="job-id">Completed</span>
                                        </p>
                                        <p class="job-info">
                                            <span><i class="ph ph-arrow-right"></i> Start Date:</span>
                                            <span class="job-id">${new Date(jobdataa.createdAt).toDateString()}</span>
                                        </p>
                                        <p class="job-info">
                                            <span>End Date:</span>
                                            <span class="job-id">${new Date(jobdataa.updatedAt).toDateString()}</span>
                                        </p>

                                        <span><i class="ph ph-arrow-right"></i> Job Images:</span>
                                        <p style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                                            <span style="text-align: right; margin-left: auto;">
                                                ${jobdataa.image_after_job && Array.isArray(jobdataa.image_after_job) 
                                                    ? jobdataa.image_after_job.map(image => `
                                                        <a href="https://app.jobbie.co.nz/${image.url}" target="_blank" style="display: inline-block; margin-right: 6px;">
                                                            <img src="https://app.jobbie.co.nz/${image.url}" alt="Job Image" style="max-width: 100px; max-height: 100px; object-fit: cover; cursor: pointer;" />
                                                        </a>
                                                    `).join('') 
                                                    : '<span>No images available</span>'
                                                }
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <h4 style="margin-top: 20px;display: inline-block;"> Thank you for using Gumboot.</h4>
                                <h5 style="font-size: 15px;font-weight: normal;">Best Regards,</h5>
                                <h6 style="color: #1f98be;font-weight: normal;font-size: 15px;margin-top: 6px;margin-bottom: 60px;">The Gumboot Team</h6>

                            </div>
                        </div>
                    </body>

                    </html>
                `;

                client.sendEmail({
                    From: 'joe@jobbie.co.nz',
                    To: users.email,
                    Subject: 'Job completed',
                    HtmlBody: html2,
                    TextBody: 'Gumboot',
                    MessageStream: 'outbound'
                }).then((response) => {
                    console.log('Email sent:', response.MessageID);
                }).catch((error) => {
                    console.error('Unable to send email:', error);
                });
            }

            if (job_status === 1) {
                await job_model.findOneAndUpdate({ _id: requestedJob.job_id }, { job_status: 6 });
                // Perform payment processing logic here if needed
            }

            if (job_status === 2) {
                let getOfferPrice = await job_request.findOne({ _id: jobRequested_id })
                let offeredPrice = getOfferPrice.offered_price

                if (offeredPrice) {
                    await job_model.updateOne({ _id: job_id }, {
                        price: offeredPrice
                    })
                }
            }

            return helper.success(res, 'Job status updated successfully', { job_status, msgs });
        } catch (error) {
            console.error(error);
            return helper.failed(res, 'Something went wrong', error);
        }
    },

    job_details: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                jobId: "required",
            });
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobId = req.body.jobId;
            const userId = req.body.userId;
            
            const getdetails = await job_model.findOne({ _id: jobId, deleted: false })
                .populate("job_type")
                .populate("address")
                .populate("userId", "firstname lastname image bio user_job_cancellation_fee")
                .populate("workerId", "firstname lastname image worker_job_cancellation_fee");

            if (!getdetails) {
                return helper.failed(res, "Job not found");
            }

            const jobRequestedData = await job_request.find({ jobId: jobId }).populate("workerId", "firstname image");

            if (req.body.userId) {
                var jobRequestedDataNew = await job_request
                    .findOne({ jobId: jobId, workerId: req.body.userId })
                    .populate("workerId", "firstname image");
            }


            const completedJobsByWorker = getdetails.workerId
                ? await job_model
                    .find({ workerId: getdetails.workerId._id, job_status: "7" })
                    .select("image")
                : [];

            // const jobreviewData = await review_model.findOne({ jobId: jobId });
            const jobreviewData = await review_model.findOne({ jobId: jobId, userId:userId });

           let ratedbyme = 0;
            if (jobreviewData && jobreviewData.userId == userId) {
                ratedbyme = 1;
            }
            
           let filter = {};

            const jobUserId = getdetails.userId?._id;
            const jobWorkerId = getdetails.workerId?._id;

            // Case 1 → Logged-in user = job user → get worker rating
            if (req.body.userId == jobUserId) {
                filter = {
                    $or: [
                        { userId: jobWorkerId },  
                        { workerId: jobWorkerId } 
                    ]
                };
            }

            // Case 2 → Logged-in user = job worker → get user rating
            else if (req.body.userId == jobWorkerId) {
                filter = {
                    $or: [
                        { userId: jobUserId },
                        { workerId: jobUserId }
                    ]
                };
            }

            const Ratings = await review_model.find(filter);
            const Counts = Ratings.length;
            const TotalRatings = Ratings.reduce(
                (sum, rating) => Number(sum) + Number(rating.rating),
                0
            );
            const AverageRatings = Counts > 0 ? TotalRatings / Counts : 0;

            const payment_transaction = getdetails.payment_transaction;

            let transactionFeePercent = { "service_fee": 3.5, "service_charge": 3.5 };

            if (payment_transaction && payment_transaction.paymentAmount !== undefined) {
                const paymentAmount = payment_transaction.paymentAmount;
                transactionFeePercent = calculateTransactionFee(paymentAmount);
            }

            // Check if the worker is working on other jobs
            let isWorkerWorking = null;
            if (getdetails.workerId && getdetails.workerId._id) {
                isWorkerWorking = await job_model.exists({
                    workerId: getdetails.workerId._id,
                    job_status: { $in: ["3"] },
                });
            }
            const otherJob = jobId == isWorkerWorking ? null : isWorkerWorking;

            const response = {
                getdetails,
                payment_transaction: payment_transaction,
                jobRequestedData: jobRequestedData,
                jobRequestedDataNew: jobRequestedDataNew ? jobRequestedDataNew : {},
                completedJobsByWorker: completedJobsByWorker,
                jobreviewData: jobreviewData,
                RatingData: { counts: Counts, averageRatings: AverageRatings },
                transactionFeePercent: transactionFeePercent,
                isWorkerWorking: { jobId: jobId, OtherJob: otherJob },
                ratedbyme: ratedbyme
            };

            const additionalCostList = await addCost_model.find({ jobId: req.body.jobId });

            if (additionalCostList) {
                response.additional_cost_list = additionalCostList;
            }

            return helper.success(res, "Job Details", response);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Internal server error");
        }
    },

    home_job_listing: async (req, res) => {
        try {
            // const userId = req.user._id;
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.perPage) || 10;
            const date = req.query.date;
            const jobStatus = req.query.job_status;

            // Build the filter object based on query parameters
            const filter = { deleted: false };

            if (req.query.search) {
                filter.job_title = { $regex: req.query.search, $options: 'i' };
            }

            if (req.query.job_status) {
                filter.job_status = req.query.job_status;
            }

            if (req.query.job_type) {
                filter.job_type = req.query.job_type;
            }

            if (date) {
                const currentDate = new Date()
                filter.exp_date = { $in: date }
                // filter.exp_date = { $gte: currentDate }
            } else {
                const currentDate = new Date();
                currentDate.setUTCHours(0, 0, 0, 0);

                filter.exp_date = { $gte: currentDate };
            }

            // Calculate the items to skip
            const skip = (page - 1) * perPage;
            // Query the database with pagination and filters
            const jobsData = await job_model.find(filter)
                .populate("job_type")
                .populate('address')
                .populate('servicefee', 'service_fee service_charge')
                .skip(skip)
                .limit(perPage)
                .sort({ createdAt: -1 })
                .populate("userId", "firstname image");


            const totalJobsCount = await job_model.countDocuments(filter);
            const totalPages = Math.ceil(totalJobsCount / perPage);

            if (!jobsData) {
                return helper.failed(res, "Something went wrong");
            }

            // If jobStatus is provided, filter jobs accordingly
            if (jobStatus) {
                if (jobStatus === '7') {
                    // If job_status is 7, fetch job reviews for completed jobs
                    const completedJobs = jobsData.filter(job => job.job_status === '7');

                    // Fetch job reviews for completed jobs
                    const jobReviewData = await Promise.all(completedJobs.map(async (job) => {
                        const jobReviews = await review_model.find({ jobId: job._id });
                        return {
                            ...job._doc,
                            jobReviews
                        };
                    }));

                    return helper.success(res, "Completed Jobs listing with Job Reviews", {
                        jobs: jobReviewData,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: totalJobsCount,
                        totalPages: totalPages
                    });
                } else {
                    // Filter jobs by the provided job_status
                    const filteredJobs = jobsData.filter(job => job.job_status === jobStatus);
                    return helper.success(res, "Jobs listing", {
                        jobs: filteredJobs,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: filteredJobs.length,
                        totalPages: Math.ceil(filteredJobs.length / perPage)
                    });
                }
            } else {
                // If jobStatus is not provided, exclude jobs with job_status '7'
                const jobsWithoutCompletedStatus = jobsData.filter(job => job.job_status !== '7');

                // Fetch jobRequestedData for all jobs
                const jobsWithRequestedData = await Promise.all(jobsWithoutCompletedStatus.map(async (job) => {
                    let filter = { jobId: job._id };
                    const jobRequestData = await job_request.find(filter);

                    return {
                        ...job._doc,
                        jobRequestedData: jobRequestData
                    };
                }));

                return helper.success(res, "Jobs listing", {
                    jobs: jobsWithRequestedData,
                    page: page,
                    perPage: perPage,
                    totalJobsCount: jobsWithoutCompletedStatus.length,
                    totalPages: Math.ceil(jobsWithoutCompletedStatus.length / perPage)
                });
            }
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    my_requested_jobs: async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.body.page) || 1;
    const perPage = parseInt(req.body.perPage) || 10;
    const search = req.body.search || "";

    // 🔹 Step 1: Find all job requests for the logged-in worker
    const jobRequests = await job_request.find({ workerId: userId });

    if (jobRequests.length === 0) {
      return helper.failed(res, "No job requests found.");
    }

    // 🔹 Step 2: Extract job IDs from the job requests
    const jobIds = jobRequests.map(request => request.jobId);
    const skip = (page - 1) * perPage;

    // 🔹 Step 3: Build a filter for the jobs
    const filter = {
      _id: { $in: jobIds },
      job_status: { $nin: ["0", "7"] }, // exclude status 0 and 7
      deleted: false
    };

    // 🔹 Step 4: Add search condition (by job title)
    if (search) {
      filter.job_title = { $regex: search, $options: "i" };
    }

    // 🔹 Step 5: Fetch the jobs
    const requestedJobs = await job_model
      .find(filter)
      .populate("userId", "firstname image bio")
      .populate("job_type")
      .populate("address", "location address state country zipcode city street building_number guest_user")
      .populate("servicefee", "service_fee service_charge")
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    if (!requestedJobs || requestedJobs.length === 0) {
      return helper.failed(res, "No jobs found for your request.");
    }

    // 🔹 Step 6: Add offered_price to each job
    const requestedJobsWithPrice = requestedJobs.map(job => {
      const matchingJobRequest = jobRequests.find(
        request => request.jobId && job._id && request.jobId.toString() === job._id.toString()
      );

      return {
        ...job.toObject(),
        offered_price: matchingJobRequest ? matchingJobRequest.offered_price : null,
      };
    });

    // 🔹 Step 7: Count total jobs (for pagination)
    const totalJobsCount = await job_model.countDocuments(filter);
    const totalPages = Math.ceil(totalJobsCount / perPage);

    // 🔹 Step 8: Return success response
    return helper.success(res, "Requested jobs list", {
      requestedJobs: requestedJobsWithPrice,
      page,
      perPage,
      totalJobsCount,
      totalPages,
    });

  } catch (error) {
    console.error(error);
    return helper.failed(res, "Something went wrong");
  }
    },

    // my_requested_jobs: async (req, res) => {
    //     try {
    //         let userId = req.user._id;
    //         const page = parseInt(req.query.page) || 1;
    //         const perPage = parseInt(req.query.perPage) || 10;

    //         // Get job requests for the user
    //         const Job_requests = await job_request.find({ workerId: userId });

    //         if (req.query.search) {
    //             filter.job_title = { $regex: req.query.search, $options: 'i' };
    //         }

    //         if (Job_requests.length > 0) {
    //             const jobIds = Job_requests.map(request => request.jobId);
    //             const skip = (page - 1) * perPage;

    //             // Retrieve the jobs based on the jobIds
    //             const requestedJobs = await job_model.find({
    //                 _id: { $in: jobIds,
    //                     job_title: req.query.search ? req.query.search : 
    //                  }
    //             })
    //                 .populate('userId', 'firstname image bio')
    //                 .populate('job_type')
    //                 .populate('address', 'location address state country zipcode city street building_number guest_user')
    //                 .populate('servicefee', 'service_fee service_charge')
    //                 .skip(skip)
    //                 .limit(perPage)
    //                 .sort({ createdAt: -1 });

    //             // Add offered_price to each job
    //             const requestedJobsWithPrice = requestedJobs.map(job => {
    //                 // Find the matching job request to get the offered_price
    //                 const matchingJobRequest = Job_requests.find(request => {
    //                     return request.jobId && job._id && request.jobId.toString() === job._id.toString();
    //                 });

    //                 // Check if matchingJobRequest is found and return the job with offered_price
    //                 return {
    //                     ...job.toObject(), // Spread job properties
    //                     offered_price: matchingJobRequest ? matchingJobRequest.offered_price : null, // Add offered_price
    //                 };
    //             });

    //             // Filter jobs based on their status
    //             const filteredJobs = requestedJobsWithPrice.filter(job => job.job_status != 7 && job.job_status != 0);

    //             // Count the total number of jobs that match the conditions
    //             const totalJobsCount = await job_request.countDocuments({
    //                 workerId: userId,
    //                 job_status: "1"
    //             });

    //             const totalPages = Math.ceil(totalJobsCount / perPage);

    //             return helper.success(res, "Requested jobs list", {
    //                 requestedJobs: filteredJobs,
    //                 page: page,
    //                 perPage: perPage,
    //                 totalJobsCount: totalJobsCount,
    //                 totalPages: totalPages
    //             });
    //         } else {
    //             return helper.failed(res, "No job requests found.");
    //         }

    //     } catch (error) {
    //         console.error(error);
    //         return helper.failed(res, "Something went wrong");
    //     }
    // },



}