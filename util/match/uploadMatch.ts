import { clients, parse, prisma } from "../../server";
import { updateTeam } from "../team/updateTeam";

export const uploadMatch = async (message: string) => {
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

	const newId = matches.push(match);

	const matchId = matches.sort((e, b) => b.id - e.id)[0].id + 1;

	match.id = matchId;

	console.log("matches: " + matches, newId, matchId + " :end");

	await prisma.match
		.create({
			data: {
				...match,
				id: matchId || newId,
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
		})
		.then(() => clients.update(matches, teams))
		.catch((err) => console.log("ERROR: " + err.message));
};
