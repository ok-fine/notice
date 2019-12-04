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

    //在自己日程中添加作业
	router.get('/homework', async function(req, res){
		var user_no = req.query.user_no;
		var title = req.query.title;
		var course = req.query.course;
		var content = req.query.content;
		var publish_time = req.query.publish_time;
		var end_time = req.query.end_time;

		//作业的状态默认未完成
		//新建作业
		var sql = 'INSERT INTO personal_homeworks(creator_no, title, course, content,\
					publish_time, end_time) VALUES(?, ?, ?, ?, ?, ?)';
		var values = [user_no, title, course, content, publish_time, end_time];
		await db.query(sql, values);

		//得到作业编号
		var sql1 = 'SELECT homework_no FROM personal_homeworks \
					WHERE creator_no = ? AND publish_time = ?';
		var values1 = [user_no, publish_time];
		responseData.data = await db.query(sql1, values1);

		//将作业添加到用户的作业列表
		var sql2 = 'INSERT INTO user_homeworks(user_no, homework_no, is_personal) \
					VALUES(?, ?, ?)';
		var values2 = [user_no, responseData.data[0].homework_no, 1];
		await db.query(sql2, values2);

		responseData.code = '0001';
		responseData.message = '新建作业成功';

        console.log(responseData);
        res.json(responseData);
	});

	//在自己日程中添加通知
	router.get('/notice', async function(req, res){
		var user_no = req.query.user_no;
		var title = req.query.title;
		// var course = req.query.course;
		var content = req.query.content;
		var publish_time = req.query.publish_time;
		var end_time = req.query.end_time;

		//通知状态未完成
		//新建通知
		var sql = 'INSERT INTO personal_notices(creator_no, title, content, \
					publish_time, end_time) VALUES(?, ?, ?, ?, ?)';
		var values = [user_no, title, content, publish_time, end_time];
		await db.query(sql, values);

		//得到通知编号
		var sql1 = 'SELECT notice_no FROM personal_notices WHERE creator_no = ?\
					AND publish_time = ?';
		var values1 = [user_no, publish_time];
		responseData.data = await db.query(sql1, values1);

		//将通知添加到用户的通知列表
		var sql2 = 'INSERT INTO user_notices(user_no, notice_no, is_personal) \
					VALUES(?, ?, ?)';
		var values2 = [user_no, responseData.data[0].notice_no, 1];
		await db.query(sql2, values2);

		responseData.code = '0002';
		responseData.message = '新建通知成功';

        console.log(responseData);
        res.json(responseData);
	});

	//编辑自己添加的作业
	router.get('/edit_homework', async function(req, res){
		var homework_no = req.query.homework_no;
		var creator_no = req.query.user_no;
		var title = req.query.title;
		var course = req.query.course;
		var content = req.query.content;
		var publish_time = req.query.publish_time;
		var end_time = req.query.end_time;

		var sql = 'UPDATE personal_homeworks SET title = ?, course = ?, content = ?,\
					publish_time = ?, end_time = ? WHERE homework_no = ?';
		var values = [title, course, content, publish_time, end_time, homework_no];
		await db.query(sql, values);

		responseData.code = '0003';
		responseData.message = '编辑作业成功';

        console.log(responseData);
        res.json(responseData);
	});

	//编辑自己添加的通知
	router.get('/edit_notice', async function(req, res){
		var notice_no = req.query.notice_no;
		var creator_no = req.query.user_no;
		var title = req.query.title;
		var content = req.query.content;
		var publish_time = req.query.publish_time;
		var end_time = req.query.end_time;

		var sql = 'UPDATE personal_homeworks SET title = ?, content = ?,\
					publish_time = ?, end_time = ? WHERE notice_no = ?';
		var values = [title, content, publish_time, end_time, notice_no];
		await db.query(sql, values);

		responseData.code = '0004';
		responseData.message = '编辑通知成功';

        console.log(responseData);
        res.json(responseData);
	});

	//添加自己删除的作业
	router.get('/del_homework', async function(req, res){
		var user_no = req.query.user_no;
		var homework_no = req.query.homework_no;

		//删除私人的作业信息
		var sql1 = 'DELETE FROM personal_homeworks WHERE homework_no = ?';
		var values1 = [homework_no];
		await db.query(sql1, values1);

		//删除私人的作业匹配
		var sql2 = 'DELETE FROM user_homeworks WHERE user_no = ? AND homework_no = ?';
		var values2 = [user_no, homework_no];
		await db.query(sql2, values2);

		responseData.code = '0005';
		responseData.message = '删除个人作业成功';

        console.log(responseData);
        res.json(responseData);
	});

	//删除自己添加的通知
	router.get('/del_notice', async function(req, res){
		var user_no = req.query.user_no;
		var notice_no = req.query.notice_no;

		//删除私人的作业信息
		var sql1 = 'DELETE FROM personal_notices WHERE notice_no = ?';
		var values1 = [notice_no];
		await db.query(sql1, values1);

		//删除私人的作业匹配
		var sql2 = 'DELETE FROM user_notices WHERE user_no = ? AND notice_no = ?';
		var values2 = [user_no, notice_no];
		await db.query(sql2, values2);

		responseData.code = '0006';
		responseData.message = '删除个人通知成功';

        console.log(responseData);
        res.json(responseData);
	});

	return router;
}
