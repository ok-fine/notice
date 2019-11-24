const express = require('express');
const db = require('../../model/query');
const async = require('async');

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

    //获取成员
    router.get('/get_members', async function(req, res){
        var association_no = req.query.association_no;

        //获取成员编号, 成员姓名
        var sql = 'SELECT u.user_no, u.user_name \
                    FROM members AS m, user_info AS u \
                    WHERE m.member_no = u.user_no AND \
                    m.association_no = ? AND m.identity = \'成员\' AND m.status = \'已通过\'';
        var values = [association_no];
        responseData.data = await db.query(sql, values);

        if(responseData.data.length == 0){
            responseData.code = '0001';
            responseData.message = '没有可以设置为管理员的成员';
        }else{
            responseData.code = '0000';
            responseData.message = '获取成员成功';
        }

        // console.log(responseData);
        res.json(responseData);
    })

    //设置管理员
    router.get('/set_admin', async function(req, res){
        var admin_no = req.query.admin_no;
        var association_no = req.query.association_no;
        var creator_no = req.query.creator_no;
        var duty = req.query.duty;
        var course = req.query.course;
        var notice_power = req.query.notice_power;
        var homework_power = req.query.homework_power;
        var delete_power = req.query.delete_power;
        var admin_power = req.query.admin_power;

        //插入管理员  
        var sql = 'INSERT INTO administrators VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var values = [admin_no, association_no, creator_no, duty, course, 
                    notice_power, homework_power, delete_power, admin_power];
        await db.query(sql, values);
        
        //更新成员表
        var sql1 = 'UPDATE members SET identity=\'管理员\' \
                    WHERE member_no = ? AND association_no = ?';
        var values1 = [admin_no, association_no];
        await db.query(sql1, values1);
            
        responseData.code = '0000';
        responseData.message = '添加管理员成功';
        res.json(responseData);
    })

    return router;
}