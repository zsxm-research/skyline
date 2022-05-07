import "dotenv/config";

import { WebSocketServer } from "ws";

const port = 3000;

const server = new WebSocketServer({
	port,
});

server.addListener("connection", (ws) => {
	console.log("Client connected: " + ws.protocol + ", " + ws.readyState);

	ws.onmessage = (event) => {
		console.log(event.data);
	};
});
