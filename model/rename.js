const mysql = require('mysql');

module.exports={
	rename: function(oldName, name, no, start, end){
		var newName = '';
		console.log(oldName);

		var temp = oldName;
		var name1 = temp.split('姓名');
		newName = name1[0] + name + name1[1];

		var temp = newName;
		var name2 = temp.split('学号');
		newName = name2[0] + no.substring(start, end) + name2[1];

		return newName;
  	}
}
