import { Team } from "@prisma/client";
import { prisma } from "../../server";
import { tba_team } from "../../types/tba";
import { getTBA } from "../tba";

export const createTeam = async (
	id: string,
	rankingPoints?: number
): Promise<Team> =>
	getTBA(`/team/frc${id}`)
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
