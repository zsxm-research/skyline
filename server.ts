import { Match, PrismaClient, Team } from "@prisma/client";
import "dotenv/config";

import { WebSocketServer } from "ws";
import { Server } from "socket.io";
import axios from "axios";
import { MixedMatch } from "./types/match";
import { updateTeam } from "./util/team/updateTeam";
import { uploadMatch } from "./util/match/uploadMatch";
import { Clients } from "./util/clients";

const port = 8998;

export const TBA_KEY = process.env.TBA_KEY || "";

const MOCKMESSAGE =
	"blue:108:red:78:b_t:0:r_t:0:b_h:0:r_h:0:r_m:0:b_m:0:r_l:0:b_l:0:tel_r:62:tel_b:0:auto_b:0:auto_r:16:pen_b:0:pen_r:0:blue_alliance:[179?20;364?6000;]:red_alliance:[233?130;118?5000;]";

export const prisma = new PrismaClient();

export const server = new WebSocketServer({
	port,
});

export const clients = new Clients();

export const DATA_MAPPING = {
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

export const SERVER_EVENTS = {
	UPDATE_MATCHES: "update_matches",
	UPDATE_RANKS: "update_ranks",
};

export const RANKING_POINTS = {
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

export const parse = (msg: string): MixedMatch => {
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

var lastMessage = "";

server.addListener("connection", (ws) => {
	ws.onmessage = async (event) => {
		const message = String(event.data);

		console.log("MATCH: " + message);

		if (message.toLowerCase() != lastMessage.toLowerCase()) {
			lastMessage = message;
			await uploadMatch(message);
		}
	};
});
