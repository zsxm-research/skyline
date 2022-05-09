import { Match } from "@prisma/client";
import "dotenv/config";

import { WebSocketServer } from "ws";

const port = 3000;

const TBA_KEY = process.env.TBA_KEY;

const MOCKMESSAGE =
	"blue:4:red:6:b_t:15:r_t:15:b_h:5:r_h:5:b_l:0:r_l:2:b_m:3:r_m:4:blue_alliance:[118?15.0;233?20]:red_alliance:[179?15.0;]:";

const server = new WebSocketServer({
	port,
});

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

const parse = (msg: string): Match => {
	const data = msg.split(":");

	var match: Match = {
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
	};

	for (var e = 0; e < data.length; e++) {
		const id = data[e];
		const value = data[e + 1];

		switch (id) {
			case DATA_MAPPING.BLUE:
				match.blueScore = Number(value);
				break;

			case DATA_MAPPING.RED:
				match.redScore = Number(value);
				break;

			case DATA_MAPPING.BLUE_TRAVERSE:
				match.blueHangTraverse = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_TRAVERSE:
				match.redHangTraverse = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_HIGH:
				match.blueHangHigh = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_HIGH:
				match.redHangHigh = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_MID:
				match.blueHangMid = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_MID:
				match.redHangMid = Number(value) > 0;
				break;

			case DATA_MAPPING.BLUE_LOW:
				match.blueHangLow = Number(value) > 0;
				break;

			case DATA_MAPPING.RED_LOW:
				match.redHangLow = Number(value) > 0;
				break;

			case DATA_MAPPING.TELEOP_BLUE:
				match.blueTeleScore = Number(value);
				break;

			case DATA_MAPPING.TELEOP_RED:
				match.redTeleScore = Number(value);
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

					if (i != raw.length && team != null && team != "") {
						teams = [...teams, team];
					}
				}

				match.blueAlliance = [...match.blueAlliance, ...teams];
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

					if (i != raw_.length && team != null && team != "") {
						teams = [...teams, team];
					}
				}

				match.redAlliance = [...match.redAlliance, ...teams];
				break;
		}
	}

	console.log(match);

	return match;
};

parse(MOCKMESSAGE);

server.addListener("connection", (ws) => {
	console.log("Client connected: " + ws.OPEN + ", " + ws.readyState);

	ws.onmessage = (event) => {
		console.log(event.data);
	};
});
