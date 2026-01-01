var uuid = require('uuid');
var path = require('path');
const Users = require('../model/Admin/user_model');
const Messages = require('../model/socket/message');
const Socketuser = require('../model/socket/socketusers')

module.exports = {
  create_time_stamp: async function () {
    let current_time = Math.round(new Date().getTime() / 1000);
    return current_time;
  },

  image_base_64: async function (get_message, extension_data) {
    var image = get_message;
    var data = image.replace(/^data:image\/\w+;base64,/, '');
    var extension = extension_data;
    var filename = Math.floor(Date.now() / 1000) + '.' + extension;
    var base64Str = data;
    upload_path = path.join(__dirname, '../public/uploads/chat/' + filename);
    if (extension) {
      fs.writeFile(
        upload_path,
        base64Str,
        {
          encoding: 'base64',
        },
        function (err) {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    return filename;
  },

  get_user_details_for_push: async function (get_data) {
    try {
      var get_user_details = await Users.findOne({ _id: get_data.receiver_id });
      return get_user_details;
    } catch (error) {
      throw error;
    }
  },

  read_unread: async function updateReadStatus(getReadStatus) {
    try {

      const filter = {
        senderId: getReadStatus.receiver_id,
        receiverId: getReadStatus.sender_id
      };

      const update = {
        $set: {
          readStatus: 1,
        }
      };

      const updateReadStatusResult = await Messages.updateMany(filter, update);

      return updateReadStatusResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  chatList: async function (msg) {
    try {
      const mongoose = require('mongoose');
      const id = new mongoose.Types.ObjectId(msg.sender_id);     

      const get_message1 = await Messages.aggregate([
        {
          $match: {
            $or: [
              { sender_id: id },
              { receiver_id: id }
            ]
          }
        },
        {
          $group: {
            _id: '$constant_id',
            messages: { $addToSet: '$$ROOT' }
          }
        }
      ]);

      const constantId = get_message1.map(data => data._id);

      // const get_message = await Messages.aggregate([
      //   {
      //     $match: {
      //       constant_id: { $in: constantId }
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'sender_id',
      //       foreignField: '_id',
      //       as: 'sender',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'receiver_id',
      //       foreignField: '_id',
      //       as: 'receiver',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'socketusers',
      //       localField: 'sender_id',
      //       foreignField: 'userId',
      //       as: 'senderSocketUser',
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: { constant_id: '$constant_id' },
      //       doc: { $last: '$$ROOT' },
      //       senderOnlineStatus: { $first: '$receiver.onlineStatus' },
      //       unreadCount: {
      //         $sum: {
      //           $cond: [
      //             {
      //               $and: [
      //                 { $eq: ['$readStatus', '0'] },
      //                 { $eq: ['$receiver_id', id] }
      //               ]
      //             },
      //             1,
      //             0
      //           ]
      //         }
      //       }
      //     },
      //   },
      //   {
      //     $replaceRoot: {
      //       newRoot: {
      //         $mergeObjects: [
      //           { unread_count: '$unreadCount' },
      //           '$doc',
      //           { 'senderOnlineStatus': '$senderOnlineStatus' }
      //         ],
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       'senderSocketUser': 0,
      //     },
      //   },
      // ]).sort({ createdAt: -1 });

    const get_message = await Messages.aggregate([
  {
    $match: {
      constant_id: { $in: constantId }
    }
  },

  // ADD THIS
  {
    $addFields: {
      otherUserId: {
        $cond: [
          { $eq: ["$sender_id", id] },
          "$receiver_id",
          "$sender_id"
        ]
      }
    }
  },

  {
    $lookup: {
      from: 'users',
      localField: 'sender_id',
      foreignField: '_id',
      as: 'sender',
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'receiver_id',
      foreignField: '_id',
      as: 'receiver',
    },
  },

  // FIX SOCKET LOOKUP
  {
    $lookup: {
      from: 'socketusers',
      localField: 'otherUserId',
      foreignField: 'userId',
      as: 'senderSocketUser',
    },
  },

  {
    $group: {
      _id: { constant_id: '$constant_id' },
      doc: { $last: '$$ROOT' },

      // FIX ONLINE STATUS
      senderOnlineStatus: { $first: '$senderSocketUser.onlineStatus' },

      unreadCount: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ['$readStatus', '0'] },
                { $eq: ['$receiver_id', id] }
              ]
            },
            1,
            0
          ]
        }
      }
    },
  },

  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: [
          { unread_count: '$unreadCount' },
          '$doc',
          { senderOnlineStatus: '$senderOnlineStatus' }
        ],
      },
    },
  },

  {
    $project: {
      'senderSocketUser': 0,
    },
  },
    ]).sort({ createdAt: -1 });

      return get_message;
    } catch (err) {
      console.log(err);
    }
  },

  getChat: async function (get_data) {
    try {
      const mongoose = require('mongoose');
      const id = new mongoose.Types.ObjectId(get_data.sender_id);

      const constant_check = await Messages.findOne({
        $or: [
          { sender_id: get_data.sender_id, receiver_id: get_data.receiver_id },
          { receiver_id: get_data.sender_id, sender_id: get_data.receiver_id },
        ],
      });

      if (constant_check) {
        // Query the sender's online status from the 'socketusers' collection
        const senderUser = await Socketuser.findOne({ userId: get_data.sender_id });

        // Check if the sender is online using the onlineStatus field
        const senderOnline = senderUser ? senderUser.onlineStatus : 0;

        let get_message = await Messages.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'sender_id',
              foreignField: '_id',
              as: 'sender',
            },
          },
          {
            $match: {
              constant_id: constant_check.constant_id,
              deleted_by: { $ne: id },
            },
          },
          {
            $project: {
              'sender': 0, // Exclude sender details
            },
          },
        ]);

        if (get_message) {
          // Add the sender's online status to the result
          get_message[0].senderOnline = senderOnline;

          return get_message;
        }
      } else {
        return [];
      }
    } catch (err) {
      console.log(err);
    }
  },



};
