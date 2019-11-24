const express = require('express');

module.exports = function(){
    var router = express.Router();

    router.use('/add_agenda', require('./add_agenda.js')());
    router.use('/association_info', require('./association_info.js')());
    router.use('/index', require('./index.js')());
    router.use('/manage', require('./manage.js')());
    router.use('/user_info', require('./user_info.js')());
    router.use('/try', require('./try.js')());

    return router;
}