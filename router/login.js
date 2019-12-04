const express = require('express');
const check = require('../model/check_card');
const request = require('request');
const async = require('async');
const db = require('../model/query');

var responseData;

module.exports = function(){
    var router = express.Router();

    var session_key;
    var openid;
    var session_no;

    // console.log(fileDir);

    router.use('/', function(req, res, next){

        responseData = {
            code: 0,
            message: 'nmd',
        }

        next();
    });

    router.get('/is_exit', function(req, res){
        var login_code = req.query.code;

        var APP_URL = 'https://api.q.qq.com/sns/jscode2session';
        var APP_ID = '1110062508';   //小程序的app id ，在公众开发者后台可以看到
        var APP_SECRET = '9mKMWo90ysLHHmQV';  //程序的app secrect，在公众开发者后台可以看到

        request(`${APP_URL}?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${login_code}&grant_type=authorization_code`, async function(error, response, body){
            console.log('statusCode:', response && response.statusCode);
            console.log(body);

            keys = JSON.parse(body);
            session_key = keys.session_key;
            openid = keys.openid;

            //检查微信号是否被绑定
            var sql = 'SELECT user_no, card_no, user_name FROM user_info WHERE openid=?';
            var values = [openid];
            responseData.data = await db.query(sql, values);

            if(responseData.data.length == 0){
                responseData.code = '0011';
                responseData.message = '请登陆';
            }else{
                responseData.code = '0012';
                responseData.message = '登陆成功';
            }

            console.log(responseData);
            res.json(responseData);
        });
    });


    //验证微信号是否已经绑定学号并成功验证
    router.get('/', function(req, res){
        var login_code = req.query.code;
        var card_no = req.query.card_no;
        var user_name = req.query.user_name;
        // var password = req.query.password;   //换绑密码
        var portrait_href = req.query.portrait_href;
        // var is_weChat = req.query.is_weChat;

        var APP_URL = 'https://api.q.qq.com/sns/jscode2session';
        var APP_ID = '1110062508';   //小程序的app id ，在公众开发者后台可以看到
        var APP_SECRET = '9mKMWo90ysLHHmQV';  //程序的app secrect，在公众开发者后台可以看到
        if(!!login_code)
        {
            request(`${APP_URL}?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${login_code}&grant_type=authorization_code`, async function(error, response, body){
                console.log('statusCode:', response && response.statusCode);
                console.log(body);

                keys = JSON.parse(body);
                session_key = keys.session_key;
                openid = keys.openid;
                
                console.log("session_key:"+keys.session_key);
                console.log("openid:"+openid);

                //创建用户
                var sql1 = 'INSERT INTO user_info(card_no, user_name, portrait_href, session_key, openid) VALUES(?, ?, ?, ?, ?)';
                var values1 = [card_no, user_name, portrait_href, session_key, openid];
                await db.query(sql1, values1);

                var sql2 = 'SELECT user_no FROM user_info WHERE session_key = ? AND openid = ?';
                var values2 = [session_key, openid];
                responseData.data = await db.query(sql2, values2);

                responseData.code = '0014';
                responseData.message = '创建用户成功';

                console.log(responseData);
                res.json(responseData);
            });
        }
    });

    // //设置换绑密码
    // router.get('/set_password', async function(req, res){
    //     var user_no = req.query.user_no;
    //     var password = req.query.password;

    //     var sql = 'UPDATE user_info SET password = ? WHERE user_no = ?';
    //     var values = [password, user_no];
    //     responseData.data = await db.query(sql, values);

    //     responseData.code = '0015';
    //     responseData.message = '设置换绑密码成功';

    //     res.json(responseData);
    // });

    // router.get('/check_password', async function(req, res){
    //     var user_no = req.query.user_no;
    //     var password = req.query.password;

    //     var sql = 'SELECT password FROM user_info WHERE user_no = ?';
    //     var values = [user_no];
    //     var data = await db.query(sql, values);
    //     if(data[0].password == password){
    //         responseData.code = '0015';
    //         responseData.message = '密码错误';
    //     }else{
    //         responseData.code = '0016';
    //         responseData.message = '密码正确';
    //     }

    //     res.json(responseData);
    // });

    return router;
}


