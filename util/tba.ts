import axios from "axios";
import { TBA_KEY } from "../server";

export const getTBA = async (route: string) =>
	await axios.get(`https://www.thebluealliance.com/api/v3/${route}`, {
		headers: {
			"X-TBA-Auth-Key": TBA_KEY,
		},
	});
