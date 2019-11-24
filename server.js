var responseData;const express = require('express');
const bodyParser = require('body-parser');
const static = require('express-static');
const consolidate=require('consolidate');
const multer = require('multer');
const fs = require('fs');     //文件重命名
const pathLib = require('path'); //解析文件路径
const db = require('./model/query');

var server = express();
server.listen(8088);

server.use(bodyParser.urlencoded({}));

// var objMuter = multer({dest:'./upload/'});
// server.use(objMuter.any());

server.use(express.static('files'));

server.get('/tt', function (req, res) {
    var sql = 'SELECT * FROM association WHERE creator_no=?';
    var values = [];
    var data = db.query(sql, values);

    res.send(data);

    // console.log(123);
})

//登陆验证
server.use('/login', require('./router/login.js')());
server.use('/identity', require('./router/identity.js')());
server.use('/notice', require('./router/notice/router.js')());