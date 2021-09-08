import mysql from "mysql";
const { db } = require("./config.json");
class DbConnection {
	// Utilisez vos propres identifiants / schema pour la BDD
	constructor(autoclose = true) {
		this.connection = mysql.createConnection({
			host: db.host,
			user: db.user,
			password: db.password,
			database: db.name,
			port: db.port,
		});
		this.autoclose = autoclose;
	}

	performQuery(request, values = []) {
		return new Promise((resolve, reject) => {
			let q = this.connection.query(request, values, (err, rows, fields) => {
				if (err) {
					if (this.autoclose) {
						this.connection.end();
					}
					return reject(err);
				}
				if (this.autoclose) {
					this.connection.end();
				}
				return resolve({ rows, fields });
			});
		});
	}

	close() {
		this.connection.end();
	}
}

export default DbConnection;
