const express = require('express');
const db = require('../../model/query');
const async = require('async');
const formidable = require('formidable');
const fs = require('fs');
const pathLib = require('path');

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
        var notice_no = req.query.notice_no;
        var user_no = req.query.user_no;
        var is_personal = req.query.is_personal;
        if(is_personal == 0){
            var sql1 = 'SELECT n.association_no, n.title, u.user_name, n.content, n.end_time, n.method, n.get_file\
                    FROM notices AS n, user_info AS u\
                    WHERE n.notice_no=? AND n.creator_no=u.user_no';
            var values1 = [notice_no];
            responseData.data = await db.query(sql1, values1);
            var association_no = responseData.data[0].association_no;
            console.log(responseData.data[0]);
            if(responseData.data.length == 0){
                responseData.message = '查询失败';
            }else{
                responseData.code = '0001';
                responseData.message = '查询成功';
            }
            
                var sql = 'SELECT img_count, file_count FROM notices WHERE notice_no=?';
                var values = [notice_no];
                var data = await db.query(sql, values);
                var img_count = data[0].img_count;
                var file_count = data[0].file_count;
                var imgs = [];
                var files = [];
                var allfiles = [];
            if(img_count != 0 || file_count != 0){

                var file_path = pathLib.join(__dirname,'../../files') + '\/' 
                                + association_no + '\/' + 'notices' + '\/' 
                                + notice_no + '\/' + 'publish';
                allfiles = getJsonFiles(file_path);

                for(var i = 0; i < img_count + file_count; i++){
                    if(allfiles[i].indexOf("_img") != -1){
                        imgs.push('http://106.53.3.150:88/files/' + responseData.data[0].association_no + '/' + 'notices/' + notice_no + '/' + 'publish/'+ pathLib.basename(allfiles[i]));
                    }else{
                        files.push('http://106.53.3.150:88/files/' + responseData.data[0].association_no + '/' + 'notices/' + notice_no + '/' + 'publish/' + pathLib.basename(allfiles[i]));
                    }
                }
            }
            responseData.images = {
                Img: imgs
            }
            responseData.files = {
                Files: files
            }
        }else if(is_personal == 1){
            var sql1 = 'SELECT title, content, publish_time, end_time\
                    FROM personal_notices\
                    WHERE notice_no=? AND creator_no=?';
            var values1 = [notice_no, user_no];
            responseData.data = await db.query(sql1, values1);
            console.log(responseData.data[0]);
            if(responseData.data.length == 0){
                responseData.message = '查询失败';
            }else{
                responseData.code = '0001';
                responseData.message = '查询成功';
            }
        }

        sql2 = 'UPDATE user_notices SET status=\'已读\', hurry=\'0\', modify=\'0\' WHERE user_no=? AND notice_no=? AND is_personal=? AND status = \'未读\'';
        values2 = [user_no, notice_no, is_personal];
        await db.query(sql2, values2);

        res.json(responseData);
    });

    router.get('/done', async function(req, res){
        var notice_no = req.query.notice_no;
        var user_no = req.query.user_no;
        var is_personal = req.query.is_personal;

        sql = 'UPDATE user_notices SET status=\'完成\' WHERE user_no=? AND notice_no=? AND is_personal=?';
        values = [user_no, notice_no, is_personal];
        await db.query(sql, values);

        // console.log(responseData);
        res.json(responseData);
    });

    router.post('/handin', async function(req, res){        
        var form = new formidable.IncomingForm;
        var fileDir = pathLib.join(__dirname,'../../files');
        console.log(fileDir);
        form.uploadDir = fileDir;
        form.keepExtensions = true;
        
        var association_no = responseData.data[0].association_no;
        form.parse(req, async function(err, fields, files){
            var notice_no = fields['notice_no'];
            var ori_name = fields['ori_name'];
            var user_no = fields['user_no'];
            var name_way = fields['name_way'];
            var user_name = fields['user_name'];
            var card_no = fields['card_no'];
            var start = fields['start'];
            var end = fields['end'];

            var sql1 = 'SELECT h.association_no FROM homeworks AS h, user_info AS u\
                    WHERE h.homework_no=? AND h.creator_no=u.user_no';
            var values1 = [homework_no];
            responseData.data = await db.query(sql1, values1);
            
            var association_no = responseData.data[0].association_no;
            var file_path = pathLib.join(__dirname,'../../files') + '\/' + association_no + '\/' + 'notices' + '\/' + notice_no + + '\/' + 'collect';
            //根据学号姓名重命名
            var newName = name.rename(name_way, user_name, card_no, start, end);
            var newPath = file_path + '\/' + newName + pathLib.parse(files.f1.path).ext;
            console.log('newName' + newName);
            console.log('newPath' + newPath);
            fs.rename(files.f1.path, newPath, function(err){
                if(err){
                    console.log(err);
                    responseData.code = 1;
                    responseData.message = '上传失败';
                    // res.json(responseData);
                    throw err;
                }
            })

            responseData.data = notice_no;
            console.log(responseData);
            res.json(responseData);
        })
    });

    return router;
}

function getJsonFiles(jsonPath){
    let jsonFiles = [];
    function findJsonFile(path){
        let files = fs.readdirSync(path);
        files.forEach(function (item, index) {
            let fPath = pathLib.join(path,item);
            let stat = fs.statSync(fPath);
            if(stat.isDirectory() === true) {
                findJsonFile(fPath);
            }
            if (stat.isFile() === true) { 
              jsonFiles.push(fPath);
            }
        });
    }
    findJsonFile(jsonPath);
    console.log('Files: ' + jsonFiles);
    return jsonFiles;
}