const mysql = require('mysql');

var pool = mysql.createPool({
    host: '132.232.81.249',
    user: 'zzy',
    password: 'zzy666',
    database: 'notice'
});

module.exports={
	query: function(sql, values){
	// 返回一个 Promise
		try{
			return new Promise((resolve, reject) => {
				pool.getConnection(function(err, connection) {
					if(err) {
						console.log(err);
			        	reject(err);
			        }else{
			        	connection.query(sql, values, (err, data) => {
					        if(err) {
					        	console.log(err);
					        	reject(err);
					        }else{
					        	resolve(data);
					        	// res.json(data)
					        }
					        connection.release();
				      	});
			        }
			    });
	    	});
		}catch(err){
			console.log(err);
			return err;
		}
  	}
}
