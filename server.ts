import "dotenv/config";

import { WebSocketServer } from "ws";

const port = Number(process.env.PORT) || 3000;

const server = new WebSocketServer({
	port,
});

server.addListener("connection", (ws) => {
	ws.onmessage = (event) => {
		console.log(event.data);
	};
});
