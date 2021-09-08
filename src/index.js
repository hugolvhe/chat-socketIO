import express from "express";
import http, { get } from "http";
import { ppid } from "process";
import socketIO from "socket.io";
import DbConnection from "./db";

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketIO(server);

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/chat.html");
});
app.get("/chatcss", (req, res) => {
	res.sendFile(__dirname + "/chat.css");
});

let count = 0;
let usersConnected = {};
let listMessages = [];

const dbConnection = new DbConnection(false);

dbConnection.performQuery("SELECT * FROM messages").then((result) => {
	listMessages = [];
	result.rows.forEach((message) => {
		listMessages.push({ content: message.content, pseudo: message.name });
	});
	console.log(`${listMessages.length} old messages`);
});

const getCurrentUser = (id) => usersConnected[id];

// Main
io.on("connection", (socket) => {
	console.log(`New user connected: ${socket.id}`);
	console.log(`${usersConnected.size} users connected`);

	socket.on("setPseudo", (pseudo) => {
		// Incremente counter user (for ids)
		count++;
		// Create new user and add it to the list {usersConnected}
		usersConnected[socket.id] = pseudo
			? { socketId: socket.id, pseudo: pseudo, id: count, status: "online" }
			: { socketId: socket.id, pseudo: count, id: count, status: "online" };

		dbConnection
			.performQuery("INSERT INTO users(name, status) VALUES (?, ?)", [
				pseudo,
				"online",
			])
			.then(console.log(`User: ${pseudo} added`));
		// Send the event to all clients
		io.emit("connected", usersConnected);
	});

	// Send event only to the sender to get the old messages
	io.to(socket.id).emit("getOldMessages", listMessages);

	socket.on("chat_message", (msg) => {
		console.log(usersConnected);

		// Create new message
		const message = {
			socketId: getCurrentUser(socket.id).socketId,
			content: msg,
			pseudo: getCurrentUser(socket.id).pseudo,
		};
		// Add it to the list {listMessages}
		listMessages.push(message);
		// Send it back to ALL clients
		io.emit("chat_message", msg, getCurrentUser(socket.id));
		// Insert in database
		dbConnection
			.performQuery("INSERT INTO messages(content, user) VALUES (?, ?)", [
				msg,
				message.pseudo,
			])
			.then(console.log(`New message: ${msg} `));
	});

	socket.on("setStatus", (status) => {
		getCurrentUser(socket.id).status = status;
		io.emit("setStatus", getCurrentUser(socket.id));
		const { pseudo } = getCurrentUser(socket.id);
		dbConnection
			.performQuery("UPDATE users SET status = ? WHERE name = ?", [
				status,
				pseudo,
			])
			.then(console.log(`New user: ${pseudo}`));
	});

	socket.on("disconnect", () => {
		const { id } = socket;
		// Brodcast to all the user disconnected
		io.emit("disconnected", getCurrentUser(id));

		const { pseudo } = getCurrentUser(id);
		dbConnection
			.performQuery("DELETE FROM users WHERE name = ? ", [pseudo])
			.then(() => {
				console.log(`User : ${pseudo} disconnected`);
				delete usersConnected[id];
				console.log(usersConnected);
			});
	});
});

server.listen(port, () =>
	console.log(`Example app listening on port ${port}!`)
);
