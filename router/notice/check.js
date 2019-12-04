const express = require('express');
const async = require('async');
const db = require('../../model/query');
const fs = require('fs');
const pathLib = require('path');

var responseData;

module.exports = function(){
    var router = express.Router();
    router.use('/', function(req, res, next){
        responseData = {
            code:'0000',
            message:''
        };
        next();
    });

    router.get('/', async function(req, res){
        var admin_no = req.query.admin_no;

        var sql1 = 'SELECT a.association_no, a.creator_no, \
                           a.introduction, a.duty, a.name, u.user_name, a.create_reason \
                    FROM association AS a, user_info AS u \
                    WHERE a.admin_no =? AND a.creator_no=u.user_no AND a.status=\'审核中\' ';
        values = [admin_no];
        responseData.waitcheck = await db.query(sql1, values);

        var sql2 = 'SELECT a.association_no, a.name, u.user_name, \
                           a.introduction, a.create_reason \
                    FROM association AS a, user_info AS u \
                    WHERE a.admin_no =? AND a.creator_no=u.user_no AND a.status=\'已通过\' ';
        responseData.passcheck = await db.query(sql2, values);
        
        responseData.code = '0001';
        responseData.message = '查找信息成功';

        // console.log(responseData);
        res.json(responseData);
    });

    router.get('/pass', async function(req, res){
        var association_no = req.query.association_no;
        var duty = req.query.duty;
        var creator_no = req.query.creator_no;

        var sql1 = 'UPDATE association SET status=\'已通过\' WHERE  association_no=?';
        var values1 = [association_no];
        await db.query(sql1, values1);
        
        var sql3 = 'INSERT INTO members VALUES(?,?,?,?)';
        var values3 = [creator_no, association_no, '创建人', '已通过'];
        await db.query(sql3, values3);

        var sql2 = 'INSERT INTO administrators(admin_no, association_no, duty, \
                                               notice_power, homework_power, delete_power, admin_power) \
                    VALUES(?, ?, ?, ?, ?, ?, ?)';
        var values2 = [creator_no, association_no, duty, 1, 1, 1, 1];
        await db.query(sql2, values2);

        responseData.code = '0001';
        responseData.message = '更新创建者用户信息成功';

        var files_path = pathLib.join(__dirname,'../../files') + '\/' + association_no;
        if (!fs.existsSync(files_path)){  
            fs.mkdir(files_path,function(err){
                if(err){
                    responseData.code = '0001';
                    responseData.message = '创建文件夹失败';
                    console.log(responseData);
                }
            });
        }

		var temp_path = files_path;
        var files_path = temp_path + '\/' + 'notices';
        if (!fs.existsSync(files_path)){  
            fs.mkdir(files_path,function(err){
                if(err){
                    responseData.code = '0001';
                    responseData.message = '创建文件夹失败';
                    console.log(responseData);
                }
            });
        }

        var files_path = temp_path + '\/' + 'homeworks';
        if (!fs.existsSync(files_path)){  
            fs.mkdir(files_path,function(err){
                if(err){
                    responseData.code = '0001';
                    responseData.message = '创建文件夹失败';
                    console.log(responseData);
                }
            });
        }

        // console.log(responseData);
        res.json(responseData);
    });

    router.get('/refuse', async function(req,res){
        var association_no = req.query.association_no;

        var sql1 = 'DELETE FROM association WHERE association_no=?';
        var values = [association_no];
        await db.query(sql1, values);

        responseData.code = '0001';
        responseData.message = '拒绝创建成功';
        
        // console.log(responseData);
        res.json(responseData);
    });

    return router;
}