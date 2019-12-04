const express = require('express');
const db = require('../../model/query');
const async = require('async');

var responseData;

module.exports = function(){
    var router = express.Router();

    router.use('/', function(req, res, next){
        responseData = {
            code:'0000',
            message:''
        }
        next();
    });

    router.get('/', async function(req, res){
        var association_no = req.query.association_no;
        
        var sql = 'SELECT aso.name, aso.introduction, aso.duty, u.user_name\
                    FROM association AS aso, user_info AS u\
                    WHERE aso.association_no = ? AND aso.creator_no = u.user_no';
        var values = [association_no];
        var data = await db.query(sql, values);

        if(data.length == 0){
            responseData.message = '查无此群';
        }else{
            responseData.code = '0001';
            responseData.message = '查找成功';
            responseData.data = data;
        }

        // console.log(responseData);
        res.json(responseData);
    });

    router.get('/confirm', async function(req, res){
        var user_no = req.query.user_no;
        var association_no = req.query.association_no;
        var now = req.query.now;

        var sql = 'SELECT * FROM members WHERE member_no = ? AND association_no = ?';
        var values = [user_no, association_no];
        var data = await db.query(sql, values);

        if(data.length == 0){
            sql = 'INSERT INTO members VALUES(?, ?, ?, ?)';
            values = [user_no, association_no, '成员', '待审核'];
            await db.query(sql, values);

            responseData.code = '0001';
            responseData.message = '插入成功';

            //为该同学创建作业和通知列表
            //选取该群聊下所有未解之的作业
            var sql1 = 'INSERT INTO user_homeworks(user_no, homework_no) \
                        SELECT user_no, homework_no FROM user_info, homeworks\
                        WHERE association_no = ? AND DATE(end_time) > DATE(?)\
                        AND user_no = ?';
            var values1 = [association_no, now, user_no];
            await db.query(sql1, values1);

            var sql2 = 'INSERT INTO user_notices(user_no, notice_no) \
                        SELECT user_no, notice_no FROM user_info, notices\
                        WHERE association_no = ? AND DATE(end_time) > DATE(?)\
                        AND user_no = ?';
            var values2 = [association_no, now, user_no];
            await db.query(sql2, values2);

        }else if(data[0].status == '已通过'){
            responseData.code = '0002';
            responseData.message = '您已是该组织成员，请勿重复加入';

        }else{
            responseData.code = '0003';
            responseData.message = '您已申请该群，请耐心等待管理员审核';
        }

        // console.log(responseData);
        res.json(responseData);
    })
    
    return router;
}