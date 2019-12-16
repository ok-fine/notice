const express = require('express');
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

    //http://localhost:8088/notice/manage?user_no=1
    //notice/manage
    //管理模块
    router.get('/', async function(req, res){
        var user_no = req.query.user_no;

        responseData = {
            createCode: '0000',        //我创建的
            createMessage: '',
            createData: {},

            manageCode: '0000',        //我管理的
            manageMessage: '',
            manageData: {},

            joinCode: '0000',          //我加入的
            joinMessage: '',
            joinData: {},

            waitCheck: {}              //待审核的人员列表
        }

        var sql = 'SELECT name, status, association_no FROM association_info \
                    WHERE creator_no = ?';
        var values = [user_no];
        responseData.createData = await db.query(sql, values);
        responseData.createCode = '0018';
        responseData.createMessage = '我创建的群聊加载成功';

        //如果有创建群聊的话显示该群聊的人员申请部分
        if(responseData.createData.length != 0){
            var sql3 = 'SELECT u.user_name, a.name AS association_name, u.user_no, \
                        a.association_no \
                        FROM user_info AS u, members AS m, association AS a \
                        WHERE m.association_no = a.association_no AND a.association_no = ? \
                        AND u.user_no = m.member_no AND m.status = \'待审核\'';
            var values3 = [];
            var waitCheck = new Array(responseData.createData.length);
            for(var i = 0 ; i < responseData.createData.length ; i++){
                values3 = [responseData.createData[i].association_no];
                waitCheck[i] = await db.query(sql3, values3);
            }

            responseData.waitCheck = waitCheck;
        }

        //筛选用户管理的群聊信息（不包括创建的）
        var sql1 = 'SELECT a.name, m.duty, a.association_no \
                    FROM association AS a, administrators AS m \
                    WHERE m.admin_no=? AND a.association_no = m.association_no \
                    AND m.admin_no <> a.creator_no';
        var values1 = [user_no];
        responseData.manageData = await db.query(sql1, values1);
        responseData.manageCode = '0019';
        responseData.manageMessage = '我管理的群聊加载成功';

        //筛选用户加入的群聊信息（不包括创建和管理的）
        var sql2 = 'SELECT a.name, m.status, a.association_no \
                    FROM association AS a, members AS m \
                    WHERE a.association_no = m.association_no AND m.member_no=? \
                    AND m.identity = \'成员\'';
        var values2 = [user_no];
        responseData.joinData = await db.query(sql2, values2);
        responseData.joinCode = 0;
        responseData.joinMessage = '我加入的群聊加载成功';

        console.log(responseData);
        res.json(responseData);
    });

    //http://localhost:8088/notice/manage/pass?user_no=3&association_no=1
    //通过人员审核
    router.get('/pass', async function(req, res){
        var user_no = req.query.user_no;
        var association_no = req.query.association_no;

        var sql = 'UPDATE members SET status = \'已通过\' \
                    WHERE member_no = ? AND association_no = ?';
        var values = [user_no, association_no];
        await db.query(sql, values);

        responseData.code = '0020';
        responseData.message = '用户加入群聊成功';

        console.log(responseData);
        res.json(responseData);
    });

    //http://localhost:8088/notice/manage/refuse?user_no=3&association_no=1
    //未通过人员审核
    router.get('/refuse', async function(req, res){
        var user_no = req.query.user_no;
        var association_no = req.query.association_no;

        var sql = 'DELETE FROM members WHERE member_no = ? AND association_no = ?';
        var values = [user_no, association_no];
        await db.query(sql, values);

        responseData.code = '0021';
        responseData.message = '拒绝用户加入群聊';

        console.log(responseData);
        res.json(responseData);
    });

    return router;
}