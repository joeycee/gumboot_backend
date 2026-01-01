var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const fileupload = require("express-fileupload");
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { v4: uuidv4 } = require('uuid');
var jwt = require('jsonwebtoken');
const stripe = require('stripe');
require('dotenv').config();
var FCM = require('fcm-node');
let csc = require('country-state-city').default;
let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;
var cors = require('cors')
const Swal = require('sweetalert2');
var flash = require('express-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(cors())
app.use(fileupload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  abortOnLimit: true,
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 365 * 1000,
  },
}));

app.use(flash());

main().catch(err => console.log(err));  

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("db connected")
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);


const port = process.env.PORT || 4011
const socket = require("./socket/socket")(io);
http.listen(port, () => {
  console.log(`server listening on ${port}`)
}) 

module.exports = app;
