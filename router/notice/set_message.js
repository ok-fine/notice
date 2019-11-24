const express = require('express');
const db = require('../../model/query');
const async = require('async');
const join = require('path').join;
const pathLib = require('path');
const fs = require('fs');
const formidable = require('formidable');

var responseData;

module.exports = function(){
    var router = express.Router();

    router.use('/', function(req, res, next){
        responseData = {
            code: '0000',
            message: '',
        }
        next();
    });

    //检查权限
    router.get('/check_power', async function(req, res){
        var admin_no = req.query.admin_no;
        var association_no = req.query.association_no;

        //获取管理员所有权限信息
        var sql = 'SELECT * FROM administrators \
                    WHERE admin_no = ? AND association_no = ?';
        var values = [admin_no, association_no];
        responseData.data = await db.query(sql, values);

        responseData.code = '0000';
        responseData.message = '查看权限成功';
        res.json(responseData);
    })

    //获取通知和作业
    //并通过前端获取的数据选择通知或者作业信息, 并通过SQL查询
    //获得每一项通知/作业的已读/未完成/全部人数, 并在代码中注释
    router.get('/get_message', async function(req, res){
        var admin_no= req.query.admin_no;
        var association_no = req.query.association_no;
        var notice_power = req.query.notice_power;
        var homework_power = req.query.homework_power;

        //获取总人数
        var sql = 'SELECT COUNT(*) AS all_people FROM members \
                    WHERE association_no = ? AND status = \'已通过\'';        
        var values = [association_no];
        people.push(await db.query(sql, values));

        //展示通知
        //获取可管理管理员数组
        //添加自己的管理员编号
        if(notice_power == 1){
            //选择所有不是创建者也不是该管理员的管理员, 并获得所有管理员数组
            var sql1 = 'SELECT admin_no, creator_no FROM administrators \
                        WHERE admin_no<>? AND association_no = ? \
                        AND creator_no is not null AND notice_power = \'1\'';
            var values1 = [admin_no, association_no];
            var result = await db.query(sql1, values1);

            //获取可管理管理员数组
            //添加自己的管理员编号
            var adminNo = [admin_no];
            var allAdmin = getAllAdmin(result, adminNo);
            allAdmin.push(admin_no);
            responseData.data = [];
            for(var i = 0; i < allAdmin.length; i++){
                //获取通知信息, 发布者姓名
                var sql2 = 'SELECT n.*, u.user_name AS creator_name\
                            FROM notices AS n, user_info AS u\
                            WHERE n.creator_no=? AND n.association_no = ? AND n.creator_no = u.user_no \
                            ORDER BY n.publish_time';
                var values2 = [values[i], association_no];
                result = await db.query(sql2, values2);

                //通知数据
                var notices = {
                    data: {}
                };
                notices.data = result;
                for(var j = 0; j < notices.data.length; j++){
                    //获取未读人数
                    var sql3 = 'SELECT COUNT(*) AS not_read FROM user_notices \
                                WHERE status=\'未读\' AND notice_no = ?';
                    //获取已完成人数
                    var sql4 = 'SELECT COUNT(*) AS already_finished FROM user_notices \
                                WHERE if_finished = 1 AND notice_no = ?';
                    var values3 = [notices.data[j].notice_no];
                    //总人数
                    var allPeople = JSON.stringify(people[0]);
                    allPeople = JSON.parse(allPeople);
                    notices.data[j].allPeople = allPeople[0].all_people;
                    //未读人数
                    result = await db.query(sql3, values3);
                    var notRead = JSON.stringify(result[0]);
                    notRead = JSON.parse(not_read);
                    notices.data[j].notRead = notRead.not_read;
                    //已完成人数
                    result = await db.query(sql4, values3);
                    var alreadyFinished = JSON.stringify(result[0]);
                    alreadyFinished = JSON.parse(alreadyFinished);
                    notices.data[j].alreadyFinished =alreadyFinished.already_finished;

                    responseData.data.push(notices.data[j]);
                }
            }
            if(responseData.data.length == 0){
                responseData.code = '0001';
                responseData.message = '暂时没有任何通知';
            }else{
                responseData.code = '0000';
                responseData.message = '获取通知信息成功';
            }

        //展示作业
        }else if(homework_power == 1){
            //选择所有不是创建者也不是该管理员的管理员, 并获得所有管理员数组
            sql1 = 'SELECT admin_no, creator_no FROM administrators \
                    WHERE admin_no<>? AND association_no=? \
                    AND creator_no is not null AND homework_power=\'1\'';
            values1 = [admin_no, association_no];
            var result = await db.query(sql1, values1);

            //获取可管理管理员数组
            //添加自己的管理员编号
            var adminNo = [admin_no];
            var allAdmin = getAllAdmin(result, adminNo);
            allAdmin.push(admin_no);
            responseData.data = [];
            for(var i = 0; i < allAdmin.length; i++){
                //获取作业信息, 以及发布者姓名
                var sql2 = 'SELECT h.*, u.user_name AS creator_name \
                            FROM homeworks AS h, user_info AS u \
                            WHERE h.creator_no=? AND h.association_no=? AND h.creator_no=u.user_no \
                            ORDER BY h.publish_time';
                var values2 = [values[i], association_no];
                result = await db.query(sql1, values2);

                //作业数据
                var homeworks = {
                    data: {}
                };
                homeworks.data = result;
                for(var j = 0; j < homeworks.data.length; j++){
                    //获取未读人数
                    var sql3 = 'SELECT COUNT(*) AS not_read FROM user_homeworks \
                                WHERE status=\'未读\' AND homework_no = ?';
                    //获取已完成人数
                    var sql4 = 'SELECT COUNT(*) AS already_finished FROM user_homeworks \
                                WHERE if_finished = 1 AND homework_no = ?';
                    values3 = [homeworks.data[j].homework_no];
                    //总人数
                    var allPeople = JSON.stringify(people[0]);
                    allPeople = JSON.parse(allPeople);
                    homeworks.data[j].allPeople = allPeople[0].all_people;
                    //未读人数
                    result = await db.query(sql3, values3);
                    var notRead = JSON.stringify(result[0]);
                    notRead = JSON.parse(notRead);
                    homeworks.data[j].notRead = notRead.not_read;
                    //已完成人数
                    result = await db.query(sql4, values3);
                    var alreadyFinished = JSON.stringify(result[0]);
                    alreadyFinished = JSON.parse(alreadyFinished);
                    homeworks.data[j].alreadyFinished = alreadyFinished.already_finished;

                    responseData.data.push(homeworks.data[j]);
                }
            }
            if(responseData.data.length == 0){
                responseData.code = '0001';
                responseData.message = '暂时没有任何作业';
            }else{
                responseData.code = '0000';
                responseData.message = '获取作业信息成功';
            }
        }
        //console.log(responseData);
        res.json(responseData);
    })

    //获取特定的作业/通知详细信息并传送给前端
    router.get('/get_one', async function(req, res){
        var association_no = req.query.association_no;
        var notice_power = req.query.notice_power;
        var homework_power = req.query.homework_power;
        var no = req.query.no;

        if(notice_power == 1){
            //获取通知信息详情
            var sql = 'SELECT * FROM notices WHERE notice_no = ?';
            var values = [no];
            var result = await db.query(sql, values);

            if(result.length == 0){
                responseData.code = 1;
                responseData.message = '条目已不存在，请刷新';
            }else{
                responseData.code = 0;
                responseData.message = '获取通知信息成功';
                responseData.imgUrl = [];
                responseData.fileUrl = [];
                var filePath = '/home/ubuntu/hutao/notice/files/' + association_no 
                                + '/notices/' + no + '/publish/';
                var files = findSync(filePath);
                for(var i = 0; i < files.length; i++){
                    files[i] = files[i].replace('/home/ubuntu/hutao/notice',
                                'http://132.232.81.249/');         
                    //图片
                    //文件
                    if(files[i].indexOf('_img') > 0){
                        responseData.imgUrl.push(files[i]);
                    }else{
                        if(files[i].indexOf('.DS_Store') < 0){
                            responseData.fileUrl.push(files[i]);
                        }
                    }
                }
                responseData.data = result;
            }
        }else if(homework_power == 1){
            //获取作业信息详情
            var sql = 'SELECT * FROM homeworks WHERE homework_no=?';
            var values = [no];
            var result = await db.query(sql, values);

            if(result.length == 0){
                responseData.code = '0001';
                responseData.message = '条目已不存在，请刷新';
            }else{
                responseData.code = '0000';
                responseData.message = '获取作业信息成功';
                responseData.imgUrl = [];
                responseData.fileUrl = [];
                var filePath = '/home/ubuntu/hutao/notice/files/' + association_no 
                                + '/homeworks/' + no + '/publish/';
                var files = findSync(filePath);
                for(var i = 0; i < files.length; i++){
                    files[i] = files[i].replace('/home/ubuntu/hutao/notice',
                                'http://132.232.81.249/');                 
                    //图片
                    //文件
                    if(files[i].indexOf('_img') > 0){
                        responseData.imgUrl.push(files[i]);
                    }else{
                        if(files[i].indexOf('.DS_Store') < 0){
                            responseData.fileUrl.push(files[i]);
                        }
                    }
                }
                responseData.data = result;
            }
        }
        res.json(responseData);
    })

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
        var img_count = req.body.img_count;
        var file_count = req.body.file_count;
        var get_file = req.body.get_file;
        var method = req.body.method;
        var old_method = req.body.old_method;
        var named = req.body.named;
        var img_count = req.body.img_count;
        var hold = req.body.hold_img;
        var del = req.body.del_img;

        if(hold == 'undefined'){
            var holdImg = [];
        }else{
            var holdImg = hold.split(" "); 
        }

        if(del == 'undefined'){
            var delImg = [];
        }else{
            var delImg = del.split(" ");
        }
        //读取作业信息
        var sql = 'SELECT * FROM homeworks WHERE homework_no = ?';
        var values = [homework_no];
        var result = await db.query(sql, values);
        if(result.length == 0){
            responseData.code = '0001';
            responseData.message = '条目不存在,请刷新';
        }else{
            var fileName = '/home/ubuntu/hutao/notice/files/' + association_no 
                            + '/homeworks/' + homework_no + '/collect/';  
            //判断文件是否存在，是否需要创建或删除     
            if (!fs.existsSync(fileName) && get_file == 1){
                fs.mkdir(fileName, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建文件夹失败';
                        //console.log(responseData);
                        res.json(responseData);
                    }
                });
                if(method != old_method){
                    deleteFolderFile(fileName);
                }
            }else if(fs.existsSync(fileName) && get_file == 0){
                deleteFolderFile(fileName);
                fs.rmdirSync(fileName, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '删除文件夹失败';
                        //console.log(responseData);
                        res.json(responseData);
                    }
                });
                method = '图片';                                         
            }
            //删除图片
            //将现有的图片按顺序重命名
            //路径不一样时才需要重命名
            for(var i = 0 ; i < delImg.length ; i++){
                var path = del_img[i].substr(delImg[i].length - 9, 9);
                var delPath = '/home/ubuntu/hutao/notice/files/'+ association_no 
                                + '/homeworks/' + homework_no + '/publish/' + path;
                //console.log("del_path" + delPath);
                fs.unlinkSync(delPath);
            }

            for(var i = 1 ; i <= hold_img.length ; i++){
                var path = hold_img[i - 1].substr(hold_img[i - 1].length - 9, 9);
                var oldImgPath = '/home/ubuntu/hutao/notice/files/'+ association_no 
                                    + '/homeworks/' + homework_no + '/publish/' +  path;
                // console.log("old_img_path:" + old_img_path);
                var newImgPath = '/home/ubuntu/hutao/notice/files/'+ association_no 
                                    + '/homeworks/' + homework_no + '/publish/' + i + path.substr(1,3);
                if(newImgPath != oldImgPath){
                    fs.rename(oldImgPath, newImgPath, function(err){
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
    })

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
        //读取通知信息
        var sql = 'SELECT * FROM notices WHERE notice_no=?';
        var values = [notice_no];
        var result = await db.query(sql, values);

        if(result.length == 0){
            responseData.code = '0001';
            responseData.message = '条目不存在,请刷新';
        }else{
            var fileName = '/home/ubuntu/hutao/notice/files/' + association_no 
                            + '/notices/' + notice_no + '/collect/';
            //判断文件是否存在，是否需要创建或删除
            if (!fs.existsSync(fileName) && get_file == 1){
                fs.mkdir(fileName,function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '创建文件夹失败';
                        console.log(responseData);
                        res.json(responseData);
                    }
                });
                if(method != old_method){
                    deleteFolderFile(fileName);
                }
            }else if(fs.existsSync(fileName) && get_file == 0){
                deleteFolderFile(fileName);
                fs.rmdirSync(fileName, function(err){
                    if(err){
                        responseData.code = '0001';
                        responseData.message = '删除文件夹失败';
                        console.log(responseData);
                        res.json(responseData);
                    }
                });
                method = '图片';                                         
            }
            //更新通知信息
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
    })

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
            var file_path = '/home/ubuntu/hutao/notice/files/' + association_no 
                            + '/notices/' + notice_no + '/publish/';
            //判断是否是图片
            if(is_pic == 1){
                var imgNewName = file_path + '\/'  + count + '_img' 
                                + pathLib.parse(files.f1.path).ext;
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
                var fileNewName = file_path + '\/' + ori_name;
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

    //更改作业文件图片信息
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
            var file_path = '/home/ubuntu/hutao/notice/files/' + association_no 
                            + '/homeworks/' + homework_no + '/publish/';

            if(is_pic == 1){
                var imgNewName = file_path + '\/'  + count + '_img' 
                                + pathLib.parse(files.f1.path).ext;
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
                var fileNewName = file_path + '\/' + ori_name;
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

    //通知、作业加急
    router.get('/hurry', async function(req, res){
        var notice_power = req.query.notice_power;
        var homework_power = req.query.homework_power;
        var no = req.query.no;
        
        var sql;
        var values = [no];
        if(homework_power == 1){
            //更新用户状态(作业)
            sql = 'UPDATE user_homeworks SET hurry = 1 \
                    WHERE homework_no = ? AND is_personal = \'0\'\
                    AND status in (\'未读\', \'已读\')';
            await db.query(sql, values);

            responseData.code = '0000';
            responseData.message = '通知加急成功';
        }else if(notice_power == 1){
            //更新用户状态(通知)
            sql = 'UPDATE user_notices SET hurry = 1 \
                    WHERE notice_no = ? AND is_personal = \'0\'\
                    AND status in (\'未读\', \'已读\')';
            await db.query(sql, values);

            responseData.code = '0000';
            responseData.message = '作业加急成功';
        }
        res.json(responseData);
    })

    //删除, 先删除文件, 后删除文件夹
    router.get('/delete', async function(req, res){
        var association_no = req.query.association_no;
        var no = req.query.no;
        var notice_power = req.query.notice_power;
        var homework_power = req.query.homework_power;

        var sql;
        var values = [association_no, no];;
        var result;
        if(notice_power == 1){
            //读取数据
            sql = 'SELECT * FROM notices WHERE association_no = ? AND notice_no = ?';
            result = await db.query(sql, values);

            if(result.length == 0){
                responseData.code = '0001';
                responseData.message = '条目已不存在，请刷新';
            }else{
                //删除选中的通知信息
                var sql1 = 'DELECT FROM notices WHERE association_no = ? AND notice_no = ?';
                await db.query(sql1, values);

                var filename = '/home/ubuntu/hutao/notice/files/' + association_no 
                            + '/notices/' + no + '/collect/';
                if(fs.existsSync(filename)){              
                    deleteFolderFile(filename);
                    fs.rmdirSync(filename, function(err){
                        if(err){
                            responseData.code = '0001';
                            responseData.message = '删除文件夹失败';
                            console.log(responseData);
                            res.json(responseData);
                        }
                    });
                }
                responseData.code = '0000';
                responseData.message = '删除成功';
            }
            res.json(responseData);
        }else if(homework_power == 1){
            //读取数据
            sql = 'SELECT * FROM homeworks WHERE association_no = ? AND homework_no = ?';
            result = await db.query(sql, values);

            if(result.length == 0){
                responseData.code = '0001';
                responseData.message = '条目已不存在，请刷新';
            }else{
                //删除选中的作业信息
                var sql1 = 'DELECT FROM homeworks WHERE association_no = ? AND homework_no = ?';
                await db.query(sql1, values);
                var filename = '/home/ubuntu/hutao/notice/files/' + association_no 
                                + '/homeworks/' + no + '/collect/';
                if(fs.existsSync(filename)){        
                    deleteFolderFile(filename);
                    fs.rmdirSync(filename, function(err){
                        if(err){
                            responseData.code = '0001';
                            responseData.message = '删除文件夹失败';
                            console.log(responseData);
                            res.json(responseData);
                        }
                    });
                }
                responseData.code = '0000';
                responseData.message = '删除成功';
            }
            res.json(responseData);
        }
    })

    return router;
}

//获取管理员
function getAllAdmin(data, values){
    var result = [];
    while(values.length > 0){
        for(var i = 0; i < data.length; i++){
            if(data[i].creator_no == values[0]){
                values.push(data[i].admin_no);
                result.push(data[i].admin_no);      
                data.splice(i , 1);
                i--;
            }
        }
        values.splice(0, 1);
    }

    return result;
}

//递归获取文件名
function findSync(startPath){
    var result=[];
    function finder(path){
        var files = fs.readdirSync(path);
        files.forEach((val,index)=>{
            var fPath = join(path,val);
            var stats = fs.statSync(fPath);
            if(stats.isDirectory()){
                finder(fPath);
            } 
            if(stats.isFile()){
                result.push(fPath);
            }
        });
    }
    finder(startPath);
    return result;
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
    }
};