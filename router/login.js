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

    //验证微信号是否已经绑定学号并成功验证
    router.get('/', function(req, res){
        var wechat_code = req.query.code;
        var user_no = req.query.user_no;
        var user_name = req.query.user_name;
        var password = req.query.password;   //换绑密码
        var portrait_href = req.query.portrait_href;

        var APP_URL = 'https://api.weixin.qq.com/sns/jscode2session';
        var APP_ID = 'wxff0708c2fb00de45';   //小程序的app id ，在公众开发者后台可以看到
        var APP_SECRET = 'ef4b7faf887d28fd5165998e9ffc5739';  //程序的app secrect，在公众开发者后台可以看到
        if(!!wechat_code)
        {
            request(`${APP_URL}?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${wechat_code}&grant_type=authorization_code`, async function(error, response, body){
                console.log('statusCode:', response && response.statusCode);
                console.log(body);

                keys = JSON.parse(body);
                session_key = keys.session_key;
                openid = keys.openid;
                
                console.log("session_key:"+keys.session_key);
                console.log("openid:"+openid);

                //检查微信号是否被绑定
                var sql = 'SELECT user_no FROM user_info WHERE openid=?';
                var values = [openid];
                responseData.data = await db.query(sql, values);

                if(responseData.data.length == 0){
                    console.log("data.length=0");

                    //查看此用户是否存在
                    var sql1 = 'SELECT * FROM user_info WHERE user_no = ?';
                    var values1 = [user_no];
                    responseData.data = db.query(sql1, values1);

                    //用户不存在就创建
                    if(responseData.data.length == 0){
                        var sql2 = 'INSERT INTO user_info VALUES(?, ?, ?, ?, ?, ?)';
                        var values2 = [user_no, user_name, portrait_href, password, session_key, openid];
                        await db.query(sql2, values2);

                        responseData.code = 2;
                        responseData.message = '创建用户成功';
                    }else{
                        responseData.code = 1;
                        responseData.message = '该用户已存在';
                    }
                    
                    res.json(responseData);
                }else{
                        responseData.code = 0;
                        responseData.message = '登陆成功';

                        console.log(responseData);
                        res.json(responseData);
                }
            })
        }
    });

    //设置换绑密码
    router.get('/set_password', async function(req, res){
        var user_no = req.query.user_no;
        var password = req.query.password;

        var sql = 'UPDATE FROM user_info SET password = ? WHERE user_no = ?';
        var values = [password, user_no];
        responseData.data = await db.query(sql, values);

        responseData.code = 0;
        responseData.message = '设置换绑密码成功';

        res.json(responseData);
    });

    //换绑微信号,还未实现
    router.get('/set_password', async function(req, res){
        var user_no = req.query.user_no;
        var password = req.query.password;

        responseData.code = 0;
        responseData.message = '换绑成功';

        res.json(responseData);
    });

    return router;
}


