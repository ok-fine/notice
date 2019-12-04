const express = require('express');
const bodyparser = require('body-parser');
const pathLib = require('path');
const fs = require('fs');
const formidable = require('formidable');
const async = require('async');
const db = require('../../model/query');

var responseData;

module.exports = function(){
    var router = express.Router();

    router.use('/', function(req, res, next){
        responseData = {
            code: '0000',
            message: ''
        }
        next();
    });

    //http://localhost:8088/notice/user_info?user_no=1
    //我的信息
    router.get('/', async function(req, res){
        var user_no = req.query.user_no;

        responseData.homework = {
            allmes: 0,      //全部作业
            unread: 0,      //未读作业
            unfinished: 0   //未完成作业
        }

        responseData.notice = {
            allmes: 0,      //全部通知
            unread: 0,      //未读通知
            unfinished: 0   //未完成通知
        }

        //得到用户基本信息
        var sql = 'SELECT user_no, user_name, portrait_href \
                    FROM user_info WHERE user_no=?';
        var values = [user_no];
        responseData.data = await db.query(sql, values);

        //获取该用户的通知/作业量
        //全部作业数量
        var sql1 = 'SELECT COUNT(*) AS allmes FROM user_homeworks \
                    WHERE user_no = ? AND status <> \'截止\'';
        var values1 = [user_no];
        var num = await db.query(sql1, values1);
        responseData.homework.allmes = num[0].allmes;

        //全部通知数量
        sql1 = 'SELECT COUNT(*) AS allmes FROM user_notices \
                WHERE user_no = ? AND status <> \'截止\'';
        num = await db.query(sql1, values1);
        responseData.notice.allmes = num[0].allmes;

        //未读的作业数量
        var sql2 = 'SELECT COUNT(*) AS unread FROM user_homeworks \
                    WHERE user_no = ? AND status = \'未读\'';
        var values2 = [user_no];
        var num = await db.query(sql2, values2);
        responseData.homework.unread = num[0].unread;

        //未读的通知数量
        sql2 = 'SELECT COUNT(*) AS unread FROM user_notices \
                WHERE user_no = ? AND status = \'未读\'';
        num = await db.query(sql2, values2);
        responseData.notice.unread = num[0].unread;

        //未完成的作业数量
        var sql3 = 'SELECT COUNT(*) AS unfinished FROM user_homeworks \
                    WHERE user_no = ? AND if_finished = \'0\' AND status <> \'截止\'';
        var values3 = [user_no];
        var num = await db.query(sql3, values3);
        responseData.homework.unfinished = num[0].unfinished;

        //未完成的通知数量
        sql3 = 'SELECT COUNT(*) AS unfinished FROM user_notices \
                WHERE user_no = ? AND if_finished = \'0\' AND status <> \'截止\'';
        num = await db.query(sql3, values3);
        responseData.notice.unfinished = num[0].unfinished;

        responseData.code = '0021';
        responseData.message = '获取个人信息成功';

        console.log(responseData);
        res.json(responseData);
    });

    //修改用户的学号和姓名
    router.get('/edit', async function(req, res){
        var user_no = req.query.user_no;
        var card_no = req.query.card_no;
        var user_name = req.query.user_name;

        console.log('user_no' + user_no);

        var sql = 'UPDATE user_info SET card_no = ?, user_name = ? WHERE user_no = ?';
        var values = [card_no, user_name, user_no];
        responseData.data = await db.query(sql, values);

        responseData.code = '0020';
        responseData.message = '修改成功';

        console.log(responseData);
        res.json(responseData);
    });

    //设置为日间模式
    router.get('/day', async function(req, res){
        var user_no = req.query.user_no;

        console.log('user_no' + user_no);

        var sql = 'UPDATE user_info SET theme = \'日间\' WHERE user_no = ?';
        var values = [user_no];
        responseData.data = await db.query(sql, values);

        responseData.code = '0022';
        responseData.message = '设置日间模式成功';

        console.log(responseData);
        res.json(responseData);
    });

    //设置为夜间模式
    router.get('/night', async function(req, res){
        var user_no = req.query.user_no;

        console.log('user_no' + user_no);

        var sql = 'UPDATE user_info SET theme = \'夜间\' WHERE user_no = ?';
        var values = [user_no];
        responseData.data = await db.query(sql, values);

        responseData.code = '0023';
        responseData.message = '设置夜间模式成功';

        console.log(responseData);
        res.json(responseData);
    });

    //http://localhost:8088/notice/user_info/feedbacks?user_no=1&publish_time=1&content=123
    //收集用户反馈
    router.get('/feedbacks', async function(req, res){
        var user_no = req.query.user_no;
        var publish_time = req.query.publish_time;
        var content = req.query.content;

        console.log('user_no' + user_no);

        var sql = 'INSERT INTO feedbacks(user_no, publish_time, content) VALUES(?, ?, ?)';
        var values = [user_no, publish_time, content];
        responseData.data = await db.query(sql, values);
        responseData.message = '反馈成功';

        res.json(responseData);
    });

    //切换系统管理员
    router.get('/sadmin', async function(req, res){
        var user_no = req.query.user_no;

        //获取用户的系统管理员身份
        var sql = 'SELECT * FROM system_admin WHERE sadmin_no = ?';
        var values = [user_no];
        responseData.data = await db.query(sql, values);

        if(responseData.data.length == 0){
            responseData.code = '0022';
            responseData.message = '您还不是系统管理员';
        }else{
            responseData.code = '0023';
            responseData.message = '系统管理员' + responseData.data[0].name + '，您好！';
        }

        console.log(responseData);
        res.json(responseData);
    });

    return router;

}