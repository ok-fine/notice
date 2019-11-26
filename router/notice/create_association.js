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

    router.get('/', async function(req, res){
        var sql1 = 'SELECT sadmin_no, name FROM system_admin';
        values = [];
        responseData.data = await db.query(sql1, values);  

        // console.log(responseData);
        res.json(responseData);   
    });

    router.get('/create', async function(req, res){
        var name = req.query.name;
        var creator_no = req.query.creator_no;
        var duty = req.query.duty;
        var introduction = req.query.introduction;
        var create_time = req.query.create_time;
        var create_reason = req.query.create_reason;
        var admin_no = req.query.admin_no;

        var sql1 = 'INSERT INTO association(name, creator_no, duty, introduction, \
                    create_time, create_reason, admin_no) VALUES(?, ?, ?, ?, ?, ?, ?)';
        var values1 = [name, creator_no, duty, introduction, 
                       create_time, create_reason, admin_no];
        await db.query(sql1, values1);

        responseData.code = '0019';
        responseData.message = '申请创建成功';

        // console.log(responseData);
        res.json(responseData);
    });

    return router;
}