const express = require('express');
const bodyparser = require('body-parser');
const async = require('async');
const db = require('../../model/query')
const re = require('../../model/rename');;

const pathLib = require('path');
const fs = require('fs');
const formidable = require('formidable');

module.exports = function(){
	var router = express.Router();
	var fileDir = pathLib.join(__dirname,'../../files/');

	router.use('/', function(req, res, next){
        responseData = {
            code: 0,
            message: ''
        }
        next();
    });

    //localhost:8080/notice/try?name=哈哈姓名-学号-第五次作业
    router.get('/', function(req, res){
    	var name = req.query.name;

    	var newName = re.rename(name, '魏洁杨', '201711020325');

    	console.log(newName);
    	res.json(newName);
    });

    router.post('/123', function(req, res){
    	console.log(123);
    	var form = new formidable.IncomingForm();
        form.uploadDir = fileDir;
        form.keepExtensions = true;

        form.parse(req, async function(err, fields, files){
        	console.log(files.f.path);

        	// var filePath = pathLib.parse(files.f.path).dir;
        	var oldpath = files.f.path;
        	var extname = oldpath.extname(files.f.name);
        	console.log(extname);
        	var newFilePath = fileDir;
        	var newFileName = '123' + extname;

        	dataToCDN(oldpath, newFilePath, newFileName).then(function(isSuccess) {
	       		callback(isSuccess);
	        });
        });

    });
    
    return router;
}

