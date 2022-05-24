import { prisma } from "../../server";
import { AwardedRankingPoints } from "../../types/match";
import { createTeam } from "./createTeam";

export const updateTeam = async (
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

			total += awardedRankingPoints.points;

			return total;
		};

		const averagePoints = (): number => {
			let average = 0;

			opr.map(({ opr }) => {
				average += opr || 0;
			});

			average += awardedRankingPoints.points;

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
			} else if (team != null && team != "") {
				// const nt = await createTeam(team);
				await prisma.team
					.create({
						data: {
							iconUrl: "",
							id: team,
							name: team,
							rankingPoints: 0,
							createdAt: new Date(),
							loss: 0,
							won: 1,
							ap: averagePoints(),
							totalPoints: totalPoints(),
						},
					})
					.catch(async () => {
						await prisma.team.update({
							where: {
								id: team,
							},
							data: {
								iconUrl: "",
								name: team,
								rankingPoints: 0,
								createdAt: new Date(),
								loss: 0,
								won: 1,
								ap: averagePoints(),
								totalPoints: totalPoints(),
							},
						});
					});
			}
		}
	}
};
