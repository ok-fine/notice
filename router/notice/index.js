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

    //获取允许用户发作业/通知的群列表
    router.get('/', async function(req, res){
    	var user_no = req.query.user_no;

    	//获得能发作业的群
    	var sql = 'SELECT a.association_no, a.name AS association_name \
    				FROM administrators AS m, association AS a \
    				WHERE a.association_no = m.association_no \
    				AND m.admin_no = ? AND m.homework_power = 1';
    	var values = [user_no];
    	responseData.homework = await db.query(sql, values);

    	//获得能发通知的
    	var sql1 = 'SELECT a.association_no, a.name AS association_name \
    				FROM administrators AS m, association AS a \
    				WHERE a.association_no = m.association_no \
    				AND m.admin_no = ? AND m.notice_power = 1';
    	var values1 = [user_no];
    	responseData.notice = await db.query(sql1, values1);

		responseData.code = '0013';
		responseData.message = '获取用户管理的群列表成功';

		console.log(responseData);
		res.json(responseData);
    });

    //http://localhost:8088/notice/index/check?now=210
    //刷新所有用户将过期的作业和通知剔除(改变状态)
    router.get('/check', async function(req, res){
    	var now = req.query.now;

    	//刷新截止了的作业
    	var sql1 = 'UPDATE user_homeworks SET status = \'截止\' \
    				WHERE status <> \'截止\' AND ((\
    					is_personal = 1 AND homework_no = (\
    					SELECT homework_no FROM personal_homeworks WHERE DATE(end_time) < DATE(?) )\
    				) OR (\
    					is_personal = 0 AND homework_no = (\
    					SELECT homework_no FROM homeworks WHERE DATE(end_time) < DATE(?) )\
    				))';
    	var values1 = [now, now];
    	console.log(values1);
    	responseData.homework = await db.query(sql1, values1);

		responseData.code = '0015';
		responseData.message = '所有用户截止作业刷新成功';

    	//刷新通知的截止
    	var sql2 = 'UPDATE user_notices SET status = \'截止\' \
    				WHERE status <> \'截止\' AND ((\
    					is_personal = 0 AND notice_no = (\
    					SELECT notice_no FROM notices WHERE DATE(end_time) < DATE(?) )\
    				)OR (\
    					is_personal = 1 AND notice_no = (\
    					SELECT notice_no FROM personal_notices WHERE DATE(end_time) < DATE(?) )\
    				))';
    	var values2 = [now, now];
    	responseData.notice = await db.query(sql2, values2);

		responseData.code = '0014';
		responseData.message = '所有用户截止作业和通知刷新成功';

		console.log(responseData);
		res.json(responseData);
    });

    //http://localhost:8088/notice/index/all_homework?user_no=1&now=100
    //首页得到该同学的所有作业
	router.get('/all_homework', async function(req, res){
		var user_no = req.query.user_no;
		var now = req.query.now;

		//选出没有截止（end_time > now），没有标记完成属于这位同学的homework_no
		//在对应的personal或总的homeworks中找到作业的标识（corse，title，publish_time，association_no
		var sql = 'SELECT * FROM index_homeworks WHERE user_no = ? \
					AND DATE(end_time) > DATE(?) \
					ORDER BY FIELD(status, \'完成\', \'截止\'), \
					end_time ASC';
		var values = [user_no, now];
		var homework = await db.query(sql, values);
		responseData.homework = homework;

		responseData.code = '0016';
		responseData.message = '选取用户所有作业信息成功';

		console.log("all_vh:" + values);
		console.log("all_h:" + JSON.stringify(homework));
		res.json(responseData);
	});

	//首页得到该同学所有的通知
	router.get('/all_notice', async function(req, res){
		var user_no = req.query.user_no;
		var now = req.query.now;   //当前时间
		// var

		//选出没有截止（end_time > now），没有标记完成属于这位同学的homework_no
		//在对应的personal或总的homeworks中找到作业的标识（corse，title，publish_time，association_no
		var sql = 'SELECT * FROM index_notices WHERE user_no = ? \
					AND DATE(end_time) > DATE(?) \
					ORDER BY FIELD(status, \'完成\', \'截止\'), \
					end_time ASC';
		var values = [user_no, now];
		var notice = await db.query(sql, values); 
		responseData.notice = notice;

		responseData.code = '0017';
		responseData.message = '选取用户所有通知信息成功';
		
		console.log("all_vn:" + values);
		console.log("all_n:" + JSON.stringify(notice));
		res.json(responseData);

	});


	//http://localhost:8088/notice/index/homework?now=2019-11-18 18:01&user_no=1
	//访问当天截止的作所有业（包括截止了的）
	router.get('/homework', async function(req, res){
		var user_no = req.query.user_no;
		var now = req.query.now;
		var today_begin = now.substr(0, 10) + ' 00:00:00';
		var today_end = now.substr(0, 10) + ' 23:59:59';
		console.log(today_begin);
		console.log(today_end);

		//选取时间在今天的作业
		var sql = 'SELECT * FROM index_homeworks WHERE DATE(end_time) >= DATE(?) \
					AND DATE(end_time) <= DATE(?) AND user_no = ? \
					ORDER BY FIELD(status, \'完成\', \'截止\'), \
					end_time ASC';
		var values = [user_no, today_begin, today_end];
		responseData.homework = await db.query(sql, values);


		responseData.code = '0017';
		responseData.message = '获得' + now + '的作业成功';

		console.log("t_h:" + responseData.homework);
		res.json(responseData);
	});


	//访问当天的通知（包括截止了的）
	router.get('/notice', async function(req, res){
		var user_no = req.query.user_no;
		var now = req.query.now;
		var today_begin = now.substr(0, 10) + ' 00:00';
		var today_end = now.substr(0, 10) + ' 23:59';

		//选取时间在今天的作业
		var sql = 'SELECT * FROM index_notices WHERE DATE(end_time) >= DATE(?) \
					AND DATE(end_time) <= DATE(?) AND user_no = ? \
					ORDER BY FIELD(status, \'完成\', \'截止\'), \
					end_time ASC';
		var values = [user_no, today_begin, today_end];
		responseData.notice = await db.query(sql, values);

		responseData.code = '0018';
		responseData.message = '获得' + now + '的通知成功';

		console.log("t_n:" + responseData.notice);
		res.json(responseData);
	});

	return router;
}