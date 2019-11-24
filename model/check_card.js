const pathLib = require('path'); //解析文件路径
const fs = require('fs');
const AipOcrClient = require("baidu-aip-sdk").ocr;

//连接百度SDK -- 文字识别 - wjy
var APP_ID = '17612904';
var API_KEY = 'vvjU2UCYRvbfnj9XiI1QmcSt';
var SECRET_KEY = '8e5HRkIzauRbVdMSlhHnyK1VLmwbQglK';

var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);

//返回的数据结果
var responseData = {
    code: 0,
    message: '',
}

module.exports={

	check_card: function(res, check_no, check_name, card_href){
		// 带参数调用通用文字识别（高精度版）
        var options = {};
        options["detect_direction"] = "true";
        options["probability"] = "true";

        client.accurateBasic(fs.readFileSync(card_href).toString("base64"), options).then(function(result) {
            console.log(JSON.stringify(result));

            var is_student = 0; //判断学生证信息和输入信息是否匹配

            //遍历卡上的文字，查看学号或者姓名是否匹配
            for(var i = 0 ; i < result.words_result_num && is_student != 2 ; i++){
                if(result.words_result[i].words == check_name || result.words_result[i].words == check_no){
                    is_student++;
                    // console.log(result.words_result[i].words);
                }
            }

            if(is_student == 2){
                responseData.code = 0;
                responseData.message = '匹配成功';
            }else{
                responseData.code = 4;
                responseData.message = '匹配不成功，学号或姓名错误';
            }

            console.log(responseData);
	        res.json(responseData);
	        return responseData;

        }).catch(function(err) {
            // 如果发生网络错误
            console.log(err);
            responseData.code = 1;
            responseData.message = '网络错误';

            console.log(responseData);
	        res.json(responseData);
	        return responseData;
        });
	},

};

