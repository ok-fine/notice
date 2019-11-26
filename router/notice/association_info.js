const express = require('express');
const bodyparser = require('body-parser');
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

    //获取群详情的函数
    function assoInfo(association_no, user_no){
        return new Promise(async function(resolve, reect){
            //得到群详情
            var sql1 = 'SELECT a.name, u.user_name AS creator_name, a.creator_no, \
                        a.duty, a.introduction, a.create_time\
                        FROM association AS a, user_info AS u WHERE association_no = ?\
                        AND a.creator_no = u.user_no';
            var values1 = [association_no];
            responseData.info = await db.query(sql1, values1);
            // console.log(responseData.info);

            //获取群管理员列表（没有群主）
            var sql2 = 'SELECT u.user_name AS admin_name FROM user_info AS u, administrators AS a\
                        WHERE a.association_no = ? AND a.admin_no = u.user_no AND a.admin_no <> ?';
            var values2 = [association_no, responseData.info[0].creator_no];
            responseData.assoAdmin = await db.query(sql2, values2);

            resolve('获取群详情成功');
        });
    }

    //http://localhost:8088/notice/association_info?association_no=
    //普通用户进页面得到的信息
    router.get('/member', async function(req, res){
        var association_no = req.query.association_no;
        var user_no = req.query.user_no;

        //得到群详情
        await assoInfo(association_no, user_no);

        responseData.data = '0007';
        responseData.message = '获取群简介成功';

        console.log(responseData);
        res.json(responseData);
    });

    //管理员进页面的到的信息
    router.use('/admin', async function(req, res){
        var association_no = req.query.association_no;
        var user_no = req.query.user_no;

        //得到群详情
        await assoInfo(association_no, user_no);

        //查看管理员权限
        var sql = 'SELECT * FROM administrators WHERE admin_no = ? AND association_no = ?';
        var values = [user_no, association_no];
        responseData.data = await db.query(sql, values);
        
        //设置管理员
        //筛选用户可以管理的管理员列表（没有群主和自己）
        if(responseData.data[0].admin_power == '1'){
            var sql1 = 'SELECT u.user_name AS admin_name, m.member_no AS admin_no \
                        FROM members AS m, user_info AS u\
                        WHERE m.member_no <> ? AND m.association_no = ? \
                        AND m.member_no = u.user_no AND m.identity = \'管理员\'';
            var values1 = [user_no, association_no];
            responseData.adminList = await db.query(sql1, values1);
        }

        //管理成员
        if(responseData.data[0].delete_power == '1'){
            var sql2 = 'SELECT u.user_name AS member_name, m.member_no, m.association_no \
                        FROM members AS m, user_info AS u\
                        WHERE m.association_no = ? AND m.member_no = u.user_no \
                        AND m.identity = \'成员\'';
            var values2 = [association_no];
            responseData.memberList = await db.query(sql2, values2);
        }

        responseData.data = '0008';
        responseData.message = '获取群简介成功';

        console.log(responseData);
        res.json(responseData);
    });

    //删除管理员
    router.get('/del_admin', async function(req, res){
        var association_no = req.query.association_no;
        var user_no = req.query.user_no;

        //先删除表administrator，再删除表members
        var sql1 = 'DELETE FROM administrators WHERE association_no = ? AND user_no = ?';
        var values1 = [association_no, user_no];
        await db.query(sql1, values1);

        var sql2 = 'DELETE FROM members WHERE association_no = ? AND user_no = ?';
        var values2 = [association_no, user_no];
        await db.query(sql2, values2);

        responseData.data = '0009';
        responseData.message = '删除管理员成功';

        console.log(responseData);
        res.json(responseData);
    });

    //删除成员
    router.get('/del_member', async function(req, res){
        var association_no = req.query.association_no;
        var user_no = req.query.user_no;

        //删除成员成功
        var sql = 'DELETE FROM members WHERE association_no = ? AND user_no = ?';
        var values = [association_no, user_no];
        await db.query(sql, values);

        responseData.data = '0010';
        responseData.message = '删除成员成功';

        console.log(responseData);
        res.json(responseData);
    });

    //解散群聊
    router.get('/delete', async function(req, res){
        var association_no = req.query.association_no;

        //删除表notices,触发器会同时删除表user_homeworks
        var sql1 = 'DELETE FROM notices WHERE association_no = ?';
        var values1 = [association_no];
        await db.query(sql1, values1);

        //删除表homeworks
        var sql2 = 'DELETE FROM homeworks WHERE association_no = ?';
        var values2 = [association_no];
        await db.query(sql2, values2);

        //删除表members
        var sql3 = 'DELETE FROM members WHERE association_no = ?';
        var values3 = [association_no];
        await db.query(sql3, values3);

        //删除表administrator
        var sql4 = 'DELETE FROM administrators WHERE association_no = ?';
        var values4 = [association_no];
        await db.query(sql4, values4);

        //删除表association
        var sql5 = 'DELETE FROM association WHERE association_no = ?';
        var values5 = [association_no];
        await db.query(sql5, values5);

        responseData.data = '0011';
        responseData.message = '群解散成功';

        console.log(responseData);
        res.json(responseData);
    });

    return router;
}