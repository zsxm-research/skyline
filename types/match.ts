import { Match } from "@prisma/client";

export type AwardedRankingPoints = {
	team: string;
	points: number;
};

export type MixedMatch = {
	match: Match;
	awardedRankingPoints: AwardedRankingPoints[];
};
