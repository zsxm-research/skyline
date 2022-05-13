import { Match, PrismaClient, Team } from "@prisma/client";
import "dotenv/config";

import { WebSocketServer } from "ws";
import { Server } from "socket.io";
import axios from "axios";

const port = 8998;

const TBA_KEY = process.env.TBA_KEY || "";

const MOCKMESSAGE =
	"blue:108:red:78:b_t:0:r_t:0:b_h:0:r_h:0:r_m:0:b_m:0:r_l:0:b_l:0:tel_r:62:tel_b:0:auto_b:0:auto_r:16:pen_b:0:pen_r:0:blue_alliance:[179?20;364?6000;]:red_alliance:[233?130;118?5000;]";

const prisma = new PrismaClient();

const socketIO = new Server(3001, {
	cors: {
		origin: "*",
	},
});

const server = new WebSocketServer({
	port,
});

type AwardedRankingPoints = {
	team: string;
	points: number;
};

type MixedMatch = {
	match: Match;
	awardedRankingPoints: AwardedRankingPoints[];
};

export type tba_team = {
	address: null;
	city: string;
	country: string;
	gmaps_place_id: null;
	gmaps_url: null;
	key: string;
	lat: null;
	lng: null;
	location_name: null;
	motto: null;
	name: string;
	nickname: string;
	postal_code: string;
	rookie_year: number;
	school_name: string;
	state_prov: string;
	team_number: number;
	website: string;
};

const DATA_MAPPING = {
	BLUE: "blue",
	RED: "red",

	RED_TRAVERSE: "r_t",
	BLUE_TRAVERSE: "b_t",

	BLUE_HIGH: "b_h",
	RED_HIGH: "r_h",

	BLUE_MID: "b_m",
	RED_MID: "r_m",

	BLUE_LOW: "b_l",
	RED_LOW: "r_l",

	TELEOP_BLUE: "tel_b",
	TELEOP_RED: "tel_r",

	AUTO_BLUE: "auto_b",
	AUTO_RED: "auto_r",

	BLUE_ALLIANCE: "blue_alliance",
	RED_ALLIANCE: "red_alliance",

	PENALTIES_BLUE: "pen_b",
	PENALTIES_RED: "pen_r",
};

const SERVER_EVENTS = {
	UPDATE_MATCHES: "update_matches",
	UPDATE_RANKS: "update_ranks",
};

const sendTBA = async (route: string) =>
	await axios.get(`https://www.thebluealliance.com/api/v3/${route}`, {
		headers: {
			"X-TBA-Auth-Key": TBA_KEY,
		},
	});

const RANKING_POINTS = {
	WIN: 2,
	TIE: 1,

	/**
	 * 20 or more ALLIANCE colored CARGO scored in the HUB.
	 * If at least 5 ALLIANCE colored CARGO are scored in
	 * AUTO, called a QUINTET, this threshold drops to 18.
	 */
	CARGO_BONUS: 1,

	// ALLIANCE is credited with at least 16 HANGAR points
	HANGAR_BONUS: 1,
};

const parse = (msg: string): MixedMatch => {
	const data = msg.split(":");

	var mix: MixedMatch = {
		awardedRankingPoints: [],
		match: {
			blueAlliance: [],
			blueAutoScore: 0,
			blueEndScore: 0,
			blueTeleScore: 0,
			blueHangHigh: false,
			blueHangMid: false,
			blueHangLow: false,
			blueHangTraverse: false,
			blueScore: 0,
			createdAt: new Date(),
			redAlliance: [],
			id: 0,
			redAutoScore: 0,
			redEndScore: 0,
			redTeleScore: 0,
			redHangHigh: false,
			redHangMid: false,
			redHangLow: false,
			redHangTraverse: false,
			redScore: 0,
			penalties_blue: 0,
			penalties_red: 0,
		},
	};

	for (var e = 0; e < data.length; e++) {
		const id = data[e];
		const value = data[e + 1];

		switch (id) {
			case DATA_MAPPING.BLUE:
				mix.match.blueScore = Number(value);
				break;

			case DATA_MAPPING.RED:
				mix.match.redScore = Number(value);
				break;

			case DATA_MAPPING.BLUE_TRAVERSE:
				mix.match.blueHangTraverse = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_TRAVERSE:
				mix.match.redHangTraverse = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_HIGH:
				mix.match.blueHangHigh = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_HIGH:
				mix.match.redHangHigh = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_MID:
				mix.match.blueHangMid = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_MID:
				mix.match.redHangMid = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_LOW:
				mix.match.blueHangLow = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_LOW:
				mix.match.redHangLow = Number(value) > 0;
				break;

			case DATA_MAPPING.TELEOP_BLUE:
				mix.match.blueTeleScore = Number(value);
				break;

			case DATA_MAPPING.TELEOP_RED:
				mix.match.redTeleScore = Number(value);
				break;

			case DATA_MAPPING.PENALTIES_BLUE:
				mix.match.penalties_blue = Number(value);
				break;

			case DATA_MAPPING.PENALTIES_RED:
				mix.match.penalties_red = Number(value);
				break;

			case DATA_MAPPING.BLUE_ALLIANCE:
				var teams: string[] = [];
				const raw = msg
					.split(DATA_MAPPING.BLUE_ALLIANCE + ":" + "[")[1]
					.split("]")[0]
					.split(";");

				for (var i = 0; i < raw.length; i++) {
					var element = raw[i];
					var team = element.split("?")[0];
					var opr = element.split("?")[1];

					if (opr != null && opr != "") {
						mix.awardedRankingPoints.push({
							team: team,
							points: Number(opr),
						});
					}

					if (i != raw.length && team != null && team != "") {
						teams = [...teams, team];
					}
				}

				mix.match.blueAlliance = [...mix.match.blueAlliance, ...teams];
				break;

			case DATA_MAPPING.RED_ALLIANCE:
				var teams: string[] = [];
				const raw_ = msg
					.split(DATA_MAPPING.RED_ALLIANCE + ":" + "[")[1]
					.split("]")[0]
					.split(";");

				for (var i = 0; i < raw_.length; i++) {
					var element = raw_[i];
					var team = element.split("?")[0];
					var opr = element.split("?")[1];

					if (opr != null && opr != "") {
						mix.awardedRankingPoints.push({
							team: team,
							points: Number(opr),
						});
					}

					if (i != raw_.length && team != null && team != "") {
						teams = [...teams, team];
					}
				}

				mix.match.redAlliance = [...mix.match.redAlliance, ...teams];
				break;
		}
	}

	return mix;
};

const updateClients = (matches: Match[], ranking: Team[]) => {
	socketIO.emit(SERVER_EVENTS.UPDATE_MATCHES, { matches });
	socketIO.emit(SERVER_EVENTS.UPDATE_RANKS, { ranking });

	console.log("Updating clients...");
};

const createTeam = async (id: string, rankingPoints?: number): Promise<Team> =>
	sendTBA(`/team/frc${id}`)
		.then(async ({ status, data }) => {
			var team = data as tba_team;

			if (status === 200) {
				const newTeam: Team = {
					createdAt: new Date(),
					iconUrl: "",
					id: id,
					name: team.nickname,
					ap: 0,
					totalPoints: 0,
					rankingPoints: rankingPoints || 0,
					loss: 0,
					won: 0,
				};

				await prisma.team.create({
					data: newTeam,
				});

				return newTeam;
			} else {
				const newTeam: Team = {
					createdAt: new Date(),
					iconUrl: "",
					id: id,
					name: "Unknown",
					ap: 0,
					totalPoints: 0,
					rankingPoints: rankingPoints || 0,
					loss: 0,
					won: 0,
				};

				await prisma.team.create({
					data: newTeam,
				});

				return newTeam;
			}
		})
		.catch((err) => {
			return {
				createdAt: new Date(),
				iconUrl: "",
				id: id,
				name: "Unknown",
				ap: 0,
				totalPoints: 0,
				rankingPoints: rankingPoints || 0,
				loss: 0,
				won: 0,
			} as Team;
		});

const updateTeam = async (
	team: string,
	isLoss: boolean,
	awardedRankingPoints: AwardedRankingPoints
) => {
	if (team != null && team != "") {
		const opr = await prisma.playerOpr.findMany({
			where: {
				team: team,
			},
		});

		const totalPoints = (): number => {
			let total = 0;

			opr.map(({ opr }) => {
				total += opr || 0;
			});

			total = awardedRankingPoints.points;

			return total;
		};

		const averagePoints = (): number => {
			let average = 0;

			opr.map(({ opr }) => {
				average += opr || 0;
			});

			average = awardedRankingPoints.points;

			return average / (opr.length + 1);
		};

		if (isLoss) {
			const t = await prisma.team.findUnique({
				where: {
					id: team,
				},
			});

			if (t != null) {
				await prisma.team.update({
					where: {
						id: team,
					},
					data: {
						loss: t.loss + 1,
						ap: averagePoints(),
						totalPoints: totalPoints(),
					},
				});
			} else {
				const nt = await createTeam(team);

				const foundTeam = await prisma.team.findUnique({
					where: {
						id: nt.id,
					},
				});

				if (foundTeam != null) {
					await prisma.team.update({
						where: {
							id: nt.id,
						},
						data: {
							...nt,
							totalPoints: totalPoints(),
							ap: averagePoints(),
							loss: nt.loss + 1,
						},
					});
				} else {
					await prisma.team.create({
						data: {
							loss: nt.loss + 1,
							ap: averagePoints(),
							totalPoints: totalPoints(),
							iconUrl: nt.iconUrl,
							id: nt.id,
							name: nt.name,
							rankingPoints: nt.rankingPoints,
							won: nt.won,
						},
					});
				}
			}
		} else {
			const t = await prisma.team.findUnique({
				where: {
					id: team,
				},
			});

			if (t != null) {
				await prisma.team.update({
					where: {
						id: team,
					},
					data: {
						won: t.won + 1,
						ap: averagePoints(),
						totalPoints: totalPoints(),
					},
				});
			} else {
				const nt = await createTeam(team);

				await prisma.team.update({
					where: {
						id: nt.id,
					},
					data: {
						won: nt.won + 1,
						ap: averagePoints(),
						totalPoints: totalPoints(),
					},
				});
			}
		}
	}
};

const uploadMatch = async (message: string) => {
	if (message == null) {
		return;
	}

	const isValid =
		message.includes("[") &&
		message.includes("]") &&
		message.includes(";") &&
		message.includes("?") &&
		message.includes(":");

	if (!isValid) {
		return;
	}

	var teams = await prisma.team.findMany();

	const { awardedRankingPoints, match } = parse(message);

	match.blueAlliance.forEach(async (team) => {
		const teamRankingPoints = awardedRankingPoints.find((e, index) => {
			if (e.team === team) {
				return e;
			}
		}) || { points: 0, team: team };

		await updateTeam(team, match.blueScore < match.redScore, teamRankingPoints);
	});

	match.redAlliance.forEach(async (team) => {
		const teamRankingPoints = awardedRankingPoints.find((e, index) => {
			if (e.team === team) {
				return e;
			}
		}) || { points: 0, team: team };

		await updateTeam(team, match.redScore < match.blueScore, teamRankingPoints);
	});

	var matches = await prisma.match.findMany();

	matches = [...matches, match];

	const matchId = matches.sort((e, b) => b.id - e.id)[0].id + 1;

	await prisma.match.create({
		data: {
			...match,
			id: matchId,
			playerOpr: {
				createMany: {
					data: awardedRankingPoints.map((g) => {
						return {
							team: g.team,
							opr: g.points,
						};
					}),
				},
			},
		},
	});

	updateClients(matches, teams);
};

socketIO.on("connection", (socket) => {
	socket.on("update", async () => {
		const matches = await prisma.match.findMany();
		const teams = await prisma.team.findMany();

		updateClients(matches, teams);
	});
});

server.addListener("connection", (ws) => {
	ws.onmessage = async (event) => {
		const message = String(event.data);

		console.log(message);

		await uploadMatch(message);
	};
});
