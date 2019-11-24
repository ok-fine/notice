const express = require('express');
const db = require('../../model/query');
const async = require('async');
const pathLib = require('path');
const fs = require('fs');
const formidable = require('formidable');

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
        var admin_no = req.query.admin_no;
        var association_no = req.query.association_no;

        var sql1 = 'SELECT course, homework_power FROM administrators \
                    WHERE admin_no = ? AND association_no = ?';
        var values1 = [admin_no, association_no];
        responseData.data = await db.query(sql1, values1);

        // console.log(responseData);
        res.json(responseData);
    });

    router.post('/', function(req, res){
        var form = new formidable.IncomingForm;
        var fileDir = pathLib.join(__dirname,'../../files');
        console.log(fileDir);

        form.uploadDir = fileDir;
        form.keepExtensions = true;
        form.parse(req, async function(err, fields, files){
            console.log(files);
            console.log(fields);

            var count = fields['count'];
            var title = fields['title'];
            var content = fields['content'];
            var association_no = fields['association_no'];
            var creator_no = fields['creator_no'];
            var course = fields['course'];
            var publish_time = fields['publish_time'];
            var end_time = fields['end_time'];
            var img_count = fields['img_count'];
            var file_count = fields['file_count'];
            var get_file = fields['get_file'];
            var method = fields['method'];
            var named = fields['named'];
            var is_pic = fields['is_pic'];
            var ori_name = fields['ori_name'];

            var filePath = '';
            if(count == 0){
                var sql1 = 'INSERT INTO homeworks(association_no, creator_no, course, \
                            title, content, publish_time, end_time, \
                            img_count, file_count, get_file, method, named)\
                            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                var values1 = [association_no, creator_no, course, title, content, 
                               publish_time, end_time, img_count, file_count, get_file, method, named];
                await db.query(sql1, values1);

                var sql2 = 'SELECT homework_no FROM homeworks \
                            WHERE association_no = ? AND creator_no = ? AND title = ? AND content = ?';
                var values2 = [association_no, creator_no, title, content];
                var data = await db.query(sql2, values2);
                
                var homework_no = data[0].homework_no;
                filePath = pathLib.join(__dirname,'../../files') + '\/' 
                            + association_no + '\/' + 'homework' + '\/' 
                            + homework_no + '\/' + 'publish';
                console.log('filePath1:' + filePath);

                //如果需要收文件，则创建文件夹：files/association_no/homework/homework_no/collect
                if(get_file != 0){
                    // var collect_path = pathLib.join(__dirname,'../../files') + '\/' 
                    //                  + association_no + '\/' + 'homework' + '\/' 
                    //                  + homework_no + '\/' + 'collect';
                    var collect_path = pathLib.join(__dirname,'../../files') + '\/' + association_no;
                    console.log('collect_path:' + collect_path);
                    if (!fs.existsSync(collect_path)){  
                        fs.mkdir(collect_path, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹files/association_no失败';
                                console.log(responseData);
                            }
                        });
                    }

                    collect_path = collect_path + '\/' + 'homework';
                    if (!fs.existsSync(collect_path)){  
                        fs.mkdir(collect_path, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹files/association_no/homework失败';
                                console.log(responseData);
                            }
                        });
                    }

                    collect_path = collect_path + '\/' + homework_no;
                    if (!fs.existsSync(collect_path)){  
                        fs.mkdir(collect_path, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹files/association_no/homework/homework_no失败';
                                console.log(responseData);
                            }
                        });
                    }

                    collect_path = collect_path + '\/' + 'collect';
                    if (!fs.existsSync(collect_path)){  
                        fs.mkdir(collect_path, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹../collect失败';
                                console.log(responseData);
                            }
                        });
                    }
                }

                // console.log(responseData);
                res.json(responseData);
            }else if(count == 1){                
                //创建文件夹：files/association_no/homework/homework_no/publish
                var sql2 = 'SELECT homework_no FROM homeworks \
                            WHERE association_no=? AND creator_no=?';
                var values2 = [association_no, creator_no];
                var data = await db.query(sql2, values2);
                
                //filePath = pathLib.join(__dirname,'../../files') + '\/' 
                //          + association_no + '\/' + 'homework' + '\/' 
                //          + homework_no + '\/' + 'publish';
                //console.log('filePath2:' + filePath);
                var homework_no = data[0].homework_no;
                filePath = pathLib.join(__dirname,'../../files') + '\/' + association_no;
                if(img_count != 0 || file_count != 0){
                    if (!fs.existsSync(filePath)){  
                        fs.mkdir(filePath, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹files/association_no失败';
                                console.log(responseData);
                                // res.json(responseData);
                            }
                        });
                    }

                    filePath = filePath + '\/' + 'homework';
                    if (!fs.existsSync(filePath)){  
                        fs.mkdir(filePath, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹files/association_no/homework失败';
                                console.log(responseData);
                                // res.json(responseData);
                            }
                        });
                    }

                    filePath = filePath + '\/' + homework_no;
                    if (!fs.existsSync(filePath)){  
                        fs.mkdir(filePath, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹../homework_no失败';
                                console.log(responseData);
                                // res.json(responseData);
                            }
                        });
                    }

                    filePath = filePath + '\/' + 'publish';
                    if (!fs.existsSync(filePath)){  
                        fs.mkdir(filePath, function(err){
                            if(err){
                                responseData.code = 1;
                                responseData.message = '创建文件夹../publish失败';
                                console.log(responseData);
                                // res.json(responseData);
                            }
                        });
                    }

                    //重命名文件为1.JPG,2.doc,3.pdf...
                    var newName;
                    if(is_pic != 0){
                        newName = filePath + '\/' + count + '_img' + pathLib.parse(files.f1.path).ext;
                    }else{
                        newName = filePath + '\/' + ori_name;
                    }
                    //pathLib.parse(files[file].path).ext;   
                    console.log('newName' + newName);

                    fs.rename(files.f1.path, newName, function(err){
                        if(err){
                            console.log(err);
                            responseData.code = 1;
                            responseData.message = '上传失败';
                            // res.json(responseData);
                            throw err;
                        }
                    })

                    responseData.code = '0000';
                    responseData.message = '文件' + count + '上传成功';
                    responseData.data = homework_no;

                    console.log(responseData);
                    res.json(responseData);
                }
            }else{
                var sql2 = 'SELECT homework_no FROM homeworks \
                            WHERE association_no=? AND creator_no=?';
                var values2 = [association_no, creator_no];
                var data = await db.query(sql2, values2);
                
                var homework_no = data[0].homework_no;
                filePath = pathLib.join(__dirname,'../../files') + '\/' 
                            + association_no + '\/' + 'homework' + '\/' 
                            + homework_no + '\/' + 'publish';

                //重命名文件为1.JPG,2.doc,3.pdf...
                var newName;
                if(is_pic != 0){
                    newName = filePath + '\/' + count + '_img' + pathLib.parse(files.f1.path).ext;
                }else{
                    newName = filePath + '\/' + ori_name;
                }
                console.log('newName' + newName);
                
                fs.rename(files.f1.path, newName, function(err){
                    if(err){
                        responseData.code = 1;
                        responseData.message = '上传失败';
                        throw err;
                    }
                })
                
                responseData.code = 0;
                responseData.message = '文件' + count + '上传成功';
                
                // console.log(responseData);
                res.json(responseData);
            }
        })
    });

    return router;
}