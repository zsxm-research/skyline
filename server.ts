import { Match, PrismaClient, Team } from "@prisma/client";
import "dotenv/config";

import { WebSocketServer } from "ws";
import { Server } from "socket.io";
import axios from "axios";

const port = 3000;

const TBA_KEY = process.env.TBA_KEY || "";

const MOCKMESSAGE =
	"blue:4:red:6:b_t:15:r_t:15:b_h:5:r_h:5:b_l:0:r_l:2:b_m:3:r_m:4:tel_b:4:blue_alliance:[118?15.0;233?2000;6323?8;45?45;55?505;]:red_alliance:[179?15.0;364?40;2455?6;8767?70;254?7;]:";

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

	BLUE_ALLIANCE: "blue_alliance",
	RED_ALLIANCE: "red_alliance",
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

const createTeam = async (
	id: string,
	rankingPoints?: number
): Promise<Team> => {
	const req = await sendTBA(`/team/frc${id}`);
	var team = req.data as tba_team;

	if (req.status === 200) {
		const newTeam: Team = {
			createdAt: new Date(),
			iconUrl: "",
			id: id,
			name: team.nickname,
			opr: 0,
			rankingPoints: rankingPoints || 0,
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
			opr: 0,
			rankingPoints: rankingPoints || 0,
		};

		await prisma.team.create({
			data: newTeam,
		});

		return newTeam;
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

	awardedRankingPoints.forEach(async (e, i) => {
		const index = teams.findIndex((t) => t.id == e.team);
		var newTeam = teams[index];

		if (newTeam != null) {
			newTeam.rankingPoints = newTeam.rankingPoints + e.points;

			teams[index] = newTeam;
		} else {
			newTeam = await createTeam(e.team, e.points);
		}
	});

	var matches = await prisma.match.findMany();

	prisma.team.updateMany({
		data: awardedRankingPoints,
	});

	matches = [...matches, match];

	await prisma.match.create({
		data: {
			...match,
			id: matches.sort((e, b) => b.id - e.id)[0].id + 1,
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

		await uploadMatch(message);
	};
});

uploadMatch(MOCKMESSAGE);
