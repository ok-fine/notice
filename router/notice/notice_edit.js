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

    //编辑通知
    //首先获取通知信息
    //然后判断是否存在, 原本不存在, 现在需要创建
    //在创建中如要更换作业提交方式, 删除原有内容
    //如果原本存在，现在不需要则需要删除文件以及删除文件夹
    //最后更新数据库
    router.post('/edit_notice', async function(req, res){
        var notice_no = req.body.notice_no;
        var association_no = req.body.association_no;
        var creator_no = req.body.creator_no;
        var title = req.body.title;
        var content = req.body.content;
        var publish_time = req.body.publish_time;
        var end_time = req.body.end_time;
        var img_count = req.body.img_count;
        var file_count = req.body.file_count;
        var get_file = req.body.get_file;
        var method = req.body.method;
        var old_method = req.query.old_method;
        var named = req.body.named;
        var if_pub = req.body.if_pub;      //是否有新增图片 1-有，0-没有
        var img_count = req.body.img_count;//表示更改后的图片总数
        var hold = req.body.hold_img;      //存放没被删除的图片路径
        var del = req.body.del_img;        //存放没被删除的图片路径

        //获取图片增删列表
        if(hold == 'undefined'){
            var hold_img = [];
        }else{
            var hold_img = hold.split(" "); 
        }

        if(del == 'undefined'){
            var del_img = [];
        }else{
            var del_img = del.split(" ");
        }

        //读取通知信息
        var sql = 'SELECT * FROM notices WHERE notice_no=?';
        var values = [notice_no];
        var result = await db.query(sql, values);

        if(result.length == 0){
            responseData.code = '0001';
            responseData.message = '条目不存在,请刷新';
        }else{
            var filePath = '/home/ubuntu/notice/files/' + association_no 
                            + '/notices/' + notice_no;
            //判断文件是否存在，是否需要创建或删除
            if (!fs.existsSync(filePath) && get_file == 1){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建notices文件夹失败';
                        res.json(responseData);
                        throw err;
                    }
                });
            };
            filePath = filePath + '/collect/';
            //判断要求作业提交模式是否相同
            if(fs.existsSync(filePath) && method != old_method){
                deleteFolderFile(filePath);
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
                fs.mkdir(filePath,function(err){
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
                            + '/notices/' + notice_no;
            //判断文件夹是否存在，是否需要创建或删除（有新图片上传才判断）
            if (!fs.existsSync(pubPath) && if_pub == 1){
                fs.mkdir(pubPath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建notices文件夹失败';
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

            //删除图片
            for(var i = 0 ; i < del_img.length ; i++){
                var path = del_img[i].substr(del_img[i].length - 9, 9);
                var delPath = pubPath + path;
                console.log("del_path" + delPath);
                fs.unlinkSync(delPath);
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
                            responseData.code = '0030';
                            responseData.message = '图片重命名失败';
                            res.json(responseData);
                            throw err;
                        }
                    });
                }
            }

            //更新通知文字信息
            var sql1 = 'UPDATE notcies SET creator_no = ?, title = ?, content = ?, \
                        publish_time = ?, end_time = ?, img_count = ?, file_count = ?,\
                        get_file = ?, method = ?, named = ? \
                        WHERE notice_no = ?'
            var values1 = [creator_no, title, content, publish_time, end_time, 
                        img_count, file_count, get_file, method, named, notice_no];
            await db.query(sql1, values1);
            //更改人员展示信息
            var sql2 = 'UPDATE user_notices SET modify = \'1\' \
                        WHERE is_personal = \'0\' AND notice_no = ?';
            values2 = [notice_no];
            await db.query(sql2, values2);

            responseData.code = '0000';
            responseData.message = '数据更新完成';
        }

        res.json(responseData);
    });

    //更改通知文件图片信息
    //判断是否是图片, 不是则需要文件原名,是则需要图片ID
    //插入图片和文件, 并重命名
    router.post('/edit_noticefile', async function(req, res){
        var form = new formidable.IncomingForm();
        var fileDir = pathLib.join(__dirname, '../../files');
        form.uploadDir = fileDir;
        form.keepExtensions = true;
        
        form.parse(req, async function(err, fields, files){
            var notice_no = fields['notice_no'];
            var association_no = fields['association_no'];
            var is_pic = fields['is_pic'];
            var ori_name = fields['ori_name'];
            var count = fields['count'];
            var filePath = '/home/ubuntu/notice/files/' + association_no 
                            + '/notices/' + notice_no;
            //判断文件是否存在，是否需要创建或删除
            if (!fs.existsSync(filePath)){
                fs.mkdir(filePath, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建notices文件夹失败';
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
                responseData.message = '文件' + count + '上传成功';
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