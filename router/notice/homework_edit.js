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

    //编辑作业
    //首先获取作业信息
    //然后判断是否存在, 原本不存在, 现在需要创建
    //在创建中如要更换作业提交方式, 删除原有内容
    //如果原本存在，现在不需要则需要删除文件以及删除文件夹
    //最后更新数据库
    router.post('/edit_homework', async function(req, res){
        var homework_no = req.body.homework_no;
        var association_no = req.body.association_no;
        var creator_no = req.body.creator_no;
        var course = req.body.course;
        var title = req.body.title;
        var content = req.body.content;
        var publish_time = req.body.publish_time;
        var end_time = req.body.end_time;
        var file_count = req.body.file_count;
        var get_file = req.body.get_file;
        var method = req.body.method;
        var old_method = req.body.old_method;
        var named = req.body.named;
        var if_pub = req.body.if_pub;      //是否有新增图片 1-有，0-没有
        var img_count = req.body.img_count;//表示更改后的图片总数
        var hold = req.body.hold_img;      //存放没被删除的图片路径
        var del1 = req.body.del_img;       //存放被删除的图片路径
        var del2 = req.body.del_file;	   //存放被删除的文件路径

        //获取图片增删列表
        if(hold == 'undefined'){
            var hold_img = [];
        }else{
            var hold_img = hold.split("@@"); 
        }

        if(del1 == 'undefined'){
            var del_img = [];
        }else{
            var del_img = del1.split("@@");
        }
        
        if(del2 == 'undefined'){
        	var del_file = [];
        }else{
        	var del_file = del2.split("@@");
        }

        //读取作业信息
        var sql = 'SELECT * FROM homeworks WHERE homework_no = ?';
        var values = [homework_no];
        var result = await db.query(sql, values);
        if(result.length == 0){
            responseData.code = '0001';
            responseData.message = '条目不存在,请刷新';
        }else{
            var filePath = '/home/ubuntu/notice/files/' + association_no 
                            + '/homeworks/' + homework_no;
            //判断文件是否存在，是否需要创建或删除
            if (!fs.existsSync(filePath) && get_file == 1){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建homeworks文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            };
            filePath = filePath + '/collect/';
            //判断要求作业提交模式是否相同
            if(fs.existsSync(filePath) && method != old_method){
                deleteFolderFile(filePath);
                console.log(filePath);
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建collect文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                })
            }
            if (!fs.existsSync(filePath) && get_file == 1){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建collect文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            }else if(fs.existsSync(filePath) && get_file == 0){
                deleteFolderFile(filePath);
                if(fs.existsSync(filePath)){
                    responseData.code = '0001';
                    responseData.message = '删除文件夹失败';
                    res.json(responseData);
                    throw new Error('删除文件夹失败');
                }
                method = '图片';                                         
            }

            //判断作业详情是否需要文件夹存放图片或文件
            var pubPath = '/home/ubuntu/notice/files/' + association_no 
                            + '/homeworks/' + homework_no;
            //判断文件夹是否存在，是否需要创建或删除（有新图片上传才判断）
            if (!fs.existsSync(pubPath) && if_pub == 1){
                fs.mkdir(pubPath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建homeworks文件夹失败';
                        //console.log(responseData);
                        res.json(responseData);
                        throw err;
                    }
                });
            };
            pubPath = pubPath + '/publish/';
            if (!fs.existsSync(pubPath) && if_pub == 1){
                fs.mkdir(pubPath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建publish文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            }

            //删除图片
            for(var i = 0 ; i < del_img.length ; i++){
                var path = del_img[i].substr(del_img[i].length - 9, 9);
                var delPath = pubPath + path;
                console.log("del_path" + delPath);
                fs.unlinkSync(delPath);
            }
            
            //删除文件
            for(var i = 0; i < del_file.length ; i++){
            	var path = del_file[i];
            	var delPath = pubPath + path;
            	console.log("del_path" + delPath);
            	fs.unlinkSync(delPath);
            }
            
            //没有图片 没有文件 则删除publish文件夹
            if(fs.existsSync(pubPath) && img_count == 0 && file_count == 0){
                deleteFolderFile(pubPath);
                if(fs.existsSync(pubPath)){
                    responseData.code = '0001';
                    responseData.message = '删除文件夹失败';
                    res.json(responseData);
                    throw new Error('删除文件夹失败');
                }
            }

            //将现有的图片按顺序重命名
            //路径不一样时才需要重命名
            for(var i = 1 ; i <= hold_img.length ; i++){
                var path = hold_img[i - 1].substr(hold_img[i - 1].length - 9, 9);
                var old_img_path = pubPath +  path;
                // console.log("old_img_path:" + old_img_path);
                var new_img_path = pubPath + i + path.substr(1);
                if(new_img_path != old_img_path){
                    fs.rename(old_img_path, new_img_path, function(err){
                        if(err){
                            console.log(err);
                            responseData.code = '0030';
                            responseData.message = '图片重命名失败';
                            res.json(responseData);
                            throw err;
                        }
                    });
                }
            }

            //更改作业文字信息
            var sql1 = 'UPDATE homeworks SET creator_no = ?, course = ?, title = ?, \
                        content = ?, publish_time = ?, end_time = ?, img_count = ?, \
                        file_count = ?, get_file = ?, method = ?, named = ? \
                        WHERE homework_no = ?';
            var values1 = [creator_no, course, title, content, publish_time, end_time, 
                        img_count, file_count, get_file, method, named, homework_no];
            await db.query(sql1, values1);      
            //更改人员展示信息
            var sql2 = 'UPDATE user_homeworks SET modify = \'1\' \
                        WHERE is_personal = \'0\' AND homework_no = ?';
            var values2 = [homework_no];
            await db.query(sql2, values2);

            responseData.code = '0000';
            responseData.message = '数据更新完成';
        }

        res.json(responseData);
    });

    //判断是否是图片, 不是则需要文件原名,是则需要图片ID
    //插入图片和文件, 并重命名
    router.post('/edit_homeworkfile', async function(req, res){
        var form = new formidable.IncomingForm();
        var fileDir = pathLib.join(__dirname, '../../files');
        form.uploadDir = fileDir;
        form.keepExtensions = true;
        
        form.parse(req, async function(err, fields, files){
            var homework_no = fields['homework_no'];
            var association_no = fields['association_no'];
            var is_pic = fields['is_pic'];
            var ori_name = fields['ori_name'];
            var count = fields['count'];
            var filePath = '/home/ubuntu/notice/files/' + association_no 
                            + '/homeworks/' + homework_no;
            //判断文件是否存在，是否需要创建或删除
            if (!fs.existsSync(filePath)){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建homeworks文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            };
            filePath = filePath + '/publish/';
            if (!fs.existsSync(filePath)){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建publish文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            };
            //判断是否是图片
            if(is_pic == 1){
                var imgExt = pathLib.parse(files.f1.path).ext;
                var imgNewName = filePath + '\/'  + count + '_img' + imgExt;
                fs.rename(files.f1.path, imgNewName, function(err){
                    if(err){
                        console.log(err);
                        responseData.code = '0001';
                        responseData.message = '图片上传失败';
                        throw err;
                    }
                })
                responseData.code = '0000';
                responseData.message = '图片' + count + '上传成功';
                responseData.data = association_no;
            }else{
                var fileNewName = filePath + '\/' + ori_name;
                fs.rename(files.f1.path, fileNewName, function(err){
                    if(err){
                        console.log(err);
                        responseData.code = '0001';
                        responseData.message = '文件上传失败';
                        throw err;
                    }
                })
                responseData.code = '0000';
                responseData.message = '文件上传成功';
                responseData.data = association_no;
            }

            res.json(responseData);
        });
    });

    return router;
}

//递归删除文件夹中所有文件
function deleteFolderFile(path){
    if(fs.existsSync(path)){
        fs.readdirSync(path).forEach(function(file){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                deleteFolderFile(curPath);
            }else{
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};