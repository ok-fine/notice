const express = require('express');

module.exports = function(){
    var router = express.Router();

    router.use('/add_agenda', require('./add_agenda.js')());
    router.use('/association_info', require('./association_info.js')());
    router.use('/check', require('./check.js')());
    router.use('/create_association', require('./create_association.js')());
    router.use('/homework_publish', require('./homework_publish.js')());
    router.use('/homework_edit', require('./homework_edit.js')());
    router.use('/index', require('./index.js')());
    router.use('/join', require('./join.js')());
    router.use('/manage', require('./manage.js')());
    router.use('/notice_publish', require('./notice_publish.js')());
    router.use('/notice_edit', require('./notice_edit.js')());
    router.use('/set_admin', require('./set_admin.js')());
    router.use('/set_message', require('./set_message.js')());
    router.use('/user_info', require('./user_info.js')());
    router.use('/notice_info', require('./notices_info.js')());
    router.use('/homework_info', require('./homework_info.js')());
    router.use('/try', require('./try.js')());
    return router;
}
