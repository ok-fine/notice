const express = require('express');
const db = require('../../model/query');
const async = require('async');
const formidable = require('formidable');
const fs = require('fs');
const pathLib = require('path');
const name = require('../../model/rename');

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

    router.get('/get_info', async function(req, res){
        var homework_no = req.query.homework_no;
        var user_no = req.query.user_no;
        var is_personal = req.query.is_personal;
        if(is_personal == 0){
            var sql1 = 'SELECT h.association_no, h.title, u.user_name, h.content, h.end_time, h.method, h.course, h.get_file\
                    FROM homeworks AS h, user_info AS u\
                    WHERE h.homework_no=? AND h.creator_no=u.user_no';
            var values1 = [homework_no];
            responseData.data = await db.query(sql1, values1);
            var association_no = responseData.data[0].association_no;
            console.log(responseData.data[0]);
            if(responseData.data.length == 0){
                responseData.message = '查询失败';
            }else{
                responseData.code = '0001';
                responseData.message = '查询成功';
            }
            
                var sql = 'SELECT img_count, file_count FROM homeworks WHERE homework_no=?';
                var values = [homework_no];
                var data = await db.query(sql, values);
                var img_count = data[0].img_count;
                var file_count = data[0].file_count;
                var imgs = [];
                var files = [];
                var allfiles = [];
            if(img_count != 0 || file_count != 0){
                
                var file_path = pathLib.join(__dirname,'../../files') + '\/' 
                                + association_no + '\/' + 'homeworks' + '\/' 
                                + homework_no + '\/' + 'publish';
                allfiles = getJsonFiles(file_path);
                console.log('allfiles: ' + allfiles);
                for(var i = 0; i < img_count + file_count; i++){
                    if(allfiles[i].indexOf("_img") != -1){
                        imgs.push('http://106.53.3.150:88/files/' + responseData.data[0].association_no + '/' + 'homeworks/' + homework_no + '/' + 'publish/' + pathLib.basename(allfiles[i]));
                    }else{
                        files.push('http://106.53.3.150:88/files/' + responseData.data[0].association_no + '/' + 'homeworks/' + homework_no + '/' + 'publish/' + pathLib.basename(allfiles[i]));
                    }
                }
            }
            console.log('imgs:' + imgs);
            console.log('files:' + files);
            responseData.images = {
                Img: imgs
            }
            responseData.files = {
                Files: files
            }
        }else if(is_personal == 1){
            var sql1 = 'SELECT title, course, content, publish_time, end_time\
                    FROM personal_homeworks\
                    WHERE homework_no=? AND creator_no=?';
            var values1 = [homework_no, user_no];
            responseData.data = await db.query(sql1, values1);
            console.log(responseData.data[0]);
            if(responseData.data.length == 0){
                responseData.message = '查询失败';
            }else{
                responseData.code = '0001';
                responseData.message = '查询成功';
            }
        }

        var sql2 = 'UPDATE user_homeworks SET status=\'已读\', hurry=\'0\', modify=\'0\' WHERE user_no=? AND homework_no=? AND is_personal=? AND status = \'未读\'';
        var values2 = [user_no, homework_no, is_personal];
        await db.query(sql2, values2);

        console.log(responseData);
        res.json(responseData);
    });

    router.get('/done', async function(req, res){
        var homework_no = req.query.homework_no;
        var user_no = req.query.user_no;
        var is_personal = req.query.is_personal;

        var sql = 'UPDATE user_homeworks SET status=\'完成\' WHERE user_no=? AND homework_no=? AND is_personal=?';
        var values = [user_no, homework_no, is_personal];
        var result = await db.query(sql, values);
        // var result = updat(sql, homework_no, user_no);

        // var sql2 = 'SELECT * FROM user_homeworks WHERE user_no=? AND homework_no=?';
        // var values2 = [user_no, homework_no];
        // var result = await db.query(sql2, values2);
        // console.log(values2);

        console.log(result);
        res.json(responseData);
    });

    router.post('/handin', async function(req, res){        
        var form = new formidable.IncomingForm;
        var fileDir = pathLib.join(__dirname,'../../files');
        console.log(fileDir);
        form.uploadDir = fileDir;
        form.keepExtensions = true;

        form.parse(req, async function(err, fields, files){
            var homework_no = fields['homework_no'];
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
            var file_path = pathLib.join(__dirname,'../../files') + '\/' + association_no + '\/' + 'homeworks' + '\/' + homework_no + '\/' + 'collect';
            console.log('filePath' + file_path);
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

            responseData.data = homework_no;
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

// async function updat(sql, studnet_no, homework_no){
//     var values = [studnet_no, homework_no];
//     var result = await db.query(sql, values);
//     console.log(result);
//     return result;
// }