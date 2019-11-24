const express = require('express');
const mysql = require('mysql');

var db = mysql.createPool({
    host: '132.232.81.249',
    user: 'wjy',
    password: 'wjy666',
    database: 'hutao'
});

var responseData;

module.exports = function(){
    var router = express.Router();

    router.use('/', function(req, res, next){

        responseData = {
            code: 0,
            message: '',
        }

        next();
    });

  //检查信息是否完善
    router.get('/', function(req, res){
        // var student_no = req.query.student_no;
        var student_no = 1;//测试

        db.query(`SELECT * FROM user_info WHERE student_no='${student_no}'`, function(err, data){
            if(err){
                responseData.code = 1;
                responseData.message = '数据库错误';
                res.json(responseData);
            }else{
                var sum = 0;
                for(var info in data[0]){
                    if(typeof info == 'undefined'){
                        sum++;
                    }
                }
                
                if(sum > 1){
                    responseData.code = 20;
                    responseData.message = '信息不完整';
                    res.json(responseData);
                }else{
                    responseData.code = 0;
                    responseData.message = '欢迎来到湖桃小世界';
                    res.json(responseData);
                }
            }
        });
    });

    router.use('/trade', require('./second_hand/router.js')());
    // router.use('/check', require('./check_turnout/router.js')());
    // router.use('/wall', require('./powerful_wall/router.js')());

    return router;
};
