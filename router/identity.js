const express = require('express');
const mysql = require('mysql');
const fs = require('fs');     //文件重命名
const pathLib = require('path');
const formidable = require('formidable');
const check = require('../model/check_face');

var db = mysql.createPool({
    host: '132.232.81.249',
    user: 'wjy',
    password: 'wjy666',
    database: 'hutao'
});

var responseData;

module.exports = function(){
    var router = express.Router();
    var fileDir = pathLib.join(__dirname,'../images/student_card');
    var fileDirP = pathLib.join(__dirname,'../images/portrait');

    router.use('/', function(req, res, next){

        responseData = {
            code: 0,
            message: '',
        }

        next();
    });

    router.post('/', function(req, res){
        var form = new formidable.IncomingForm();
        // var session_no = req.body.session_no;
        form.uploadDir =fileDir;
        form.keepExtensions =true;
        form.parse(req, function(err, fields, files){
            // console.log(files);
            var student_no = fields['student_no'];
            var student_name = fields['student_name'];
            var user_name = fields['user_name'];
            var is_exit = fields['is_exit'];
            var session_no = fields['session_no'];

            var card_href = "/home/ubuntu/hutao/Back-end/images/student_card/" + student_no + "_1.JPG";

            var face_href = pathLib.parse(files.face_href.path).dir + '\/' +  fields['student_no'] 
                                        + '_2.JPG';
                                         //+ pathLib.parse(files.face_href.path).ext;  //加原图片的后缀语句

            // console.log(card_href);
            // console.log(face_href);


            fs.rename(files.face_href.path, face_href, function(err){
                if(err){
                    responseData.code = 6;
                    responseData.message = '上传失败';
                    res.json(responseData);
                    throw err;
                }
                else{
                    responseData.code = 0;
                    responseData.message = '上传成功';
                    console.log(responseData);

                    //异步处理图像识别
                    responseData = check.check_face(res, is_exit, card_href, face_href, student_no, student_name, user_name, session_no);
                    // res.json(responseData);
                }
            })
        });

    });


    //人工通道
    router.get('/artificial', function(req, res){
        // var student_no = req.query.student_no;
        // var student_name = req.query.student_name;
        // var user_name = req.query.user_name;
        // var card_href = req.query.href;
        // var face_href = req.query.face_href;

        //test
        var student_no = "2017110325";
        var student_name = "魏洁杨";
        var user_name = "取不";
        var card_href = "/Users/weijieyang/hutao/Back-end/router/zzy.jpg";
        var face_href = "/Users/weijieyang/hutao/Back-end/router/1.jpg";

        // res.json(responseData);

    });


    return router;
}


