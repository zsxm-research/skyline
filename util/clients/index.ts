import { Match, Team } from "@prisma/client";
import { Server } from "socket.io";
import { prisma, SERVER_EVENTS } from "../../server";

export class Clients {
	private socketIO = new Server(3001, {
		cors: {
			origin: "*",
		},
	});

	constructor() {
		this.registerListeners();
	}

	private registerListeners() {
		this.socketIO.on("connection", (socket) => {
			socket.on("update", async () => {
				const matches = await prisma.match.findMany();
				const teams = await prisma.team.findMany();

				this.update(matches, teams);
			});
		});
	}

	public update(matches: Match[], teams: Team[]) {
		this.socketIO.emit(SERVER_EVENTS.UPDATE_MATCHES, { matches });
		this.socketIO.emit(SERVER_EVENTS.UPDATE_RANKS, { teams });

		console.log("Updating clients...");
	}
}
