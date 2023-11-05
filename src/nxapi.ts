import { addUserAgentFromPackageJson, ErrorResponse } from 'nxapi';
import CoralApi, { NintendoAccountSessionAuthorisationCoral } from 'nxapi/coral';
import SplatNet2Api from 'nxapi/splatnet2';
import SplatNet3Api from 'nxapi/splatnet3';
import { pool } from './db.js';
import { QueryResult } from 'pg';
import { ChatInputCommandInteraction } from 'discord.js';

await addUserAgentFromPackageJson(new URL('../package.json', import.meta.url), `Discord: https://discord.com/users/${process.env.ADMIN}`);

const authenticator = NintendoAccountSessionAuthorisationCoral.create();

export function authUrl() {
	return (authenticator.authorise_url);
}

export async function isUser(id: string) {
	try {
		const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
		if (!user.rows[0]) {
			return false;
		} else {
			return true;
		}
	} catch (err) {
		console.error(err);
		return false;
	}
}

export async function getUser(id: string) {
	try {
		const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
		return user;
	} catch (err) {
		console.error(err);
	}
}

export async function createTokens(interaction: ChatInputCommandInteraction) {
	const authorisedurl = new URL(interaction.options.getString('link')!);
	const authorisedparams = new URLSearchParams(authorisedurl.hash.substring(1));
	const na_session_token = await authenticator.getSessionToken(authorisedparams);
	const coral = await CoralApi.createWithSessionToken(na_session_token.session_token);

	let s2 = null;
	let s3 = null;

	try {
		s2 = await SplatNet2Api.createWithCoral(coral.nso, coral.data.user);
	} catch (err) {
		console.error(err);
	}

	try {
		s3 = await SplatNet3Api.createWithCoral(coral.nso, coral.data.user);
	} catch (err) {
		console.error(err);
	}

	try {
		await pool.query('UPDATE users SET session = $1, coral = $2, s2 = $3, s3 = $4 WHERE id = $5', [JSON.stringify(na_session_token), JSON.stringify(coral.data), JSON.stringify(s2?.data), JSON.stringify(s3?.data), interaction.user.id]);
	} catch (err) {
		console.error(err);
	}
}

export async function getTokens(user: QueryResult) {
	const na_session_token = user.rows[0].session;
	// Is session_token expired check?
	const coral = await getCoral(user, na_session_token.session_token);

	let s2;
	let s3;

	try {
		try {
			s2 = await getSplatNet2(user);
		} catch {
			s2 = null;
		}
		try {
			s3 = await getSplatNet3(user, coral);
		} catch {
			s3 = null;
		}
	} catch (err) {
		console.error(err);
	}

	return { na_session_token, coral, s2, s3 };
}

async function getCoral(user: QueryResult, na_session_token: string) {
	const auth_data = user.rows[0].coral;
	const coral = CoralApi.createWithSavedToken(auth_data);

	coral.onTokenExpired = async () => {
		const data = await coral.renewToken(na_session_token, auth_data.user);
		const new_auth_data = Object.assign({}, auth_data, data);
		try {
			await pool.query('UPDATE users SET coral = $1 WHERE id = $2', [JSON.stringify(new_auth_data), user.rows[0].id]);
		} catch (err) {
			console.error(err);
		}
		return new_auth_data;
	};
	return coral;
}

async function getSplatNet2(user: QueryResult) {
	const auth_data = user.rows[0].s2;
	if (auth_data.expires_at < Date.now()) {
		const na_session_token = user.rows[0].session;
		const coral = await getCoral(user, na_session_token.session_token);
		const coral_data = user.rows[0].coral;
		const s2 = await SplatNet2Api.createWithCoral(coral, coral_data.user);
		try {
			await pool.query('UPDATE users SET s2 = $1 WHERE id = $2', [JSON.stringify(s2.data), user.rows[0].id]);
		} catch (err) {
			console.error(err);
		}
		return s2.splatnet;
	} else {
		const s2 = SplatNet2Api.createWithSavedToken(auth_data);
		return s2;
	}
}

async function getSplatNet3(user: QueryResult, coral: CoralApi) {
	const splatnet3_auth_data = user.rows[0].s3;
	const s3 = SplatNet3Api.createWithSavedToken(splatnet3_auth_data);

	s3.onTokenExpired = async () => {
		try {
			const coral_auth_data = user.rows[0].coral;
			const data = await s3.renewTokenWithWebServiceToken(splatnet3_auth_data.webserviceToken, coral_auth_data.user);

			try {
				await pool.query('UPDATE users SET s3 = $1 WHERE id = $2', [JSON.stringify(data), user.rows[0].id]);
			} catch (err) {
				console.error(err);
			}
			return data;
		} catch (err) {
			if (err instanceof ErrorResponse && err.response.status === 401) {
				const coral_auth_data = user.rows[0].coral;
				const data = await s3.renewTokenWithCoral(coral, coral_auth_data.user);

				try {
					await pool.query('UPDATE users SET s3 = $1 WHERE id = $2', [JSON.stringify(data), user.rows[0].id]);
				} catch (err) {
					console.error(err);
				}
				return data;
			}
			throw err;
		}
	};

	s3.onTokenShouldRenew = async () => {
		try {
			const coral_auth_data = user.rows[0].coral;
			const data = await s3.renewTokenWithWebServiceToken(splatnet3_auth_data.webserviceToken, coral_auth_data.user);

			try {
				await pool.query('UPDATE users SET s3 = $1 WHERE id = $2', [JSON.stringify(data), user.rows[0].id]);
			} catch (err) {
				console.error(err);
			}
			return data;
		} catch (err) {
			if (err instanceof ErrorResponse && err.response.status === 401) {
				const coral_auth_data = user.rows[0].coral;
				const data = await s3.renewTokenWithCoral(coral, coral_auth_data.user);

				try {
					await pool.query('UPDATE users SET s3 = $1 WHERE id = $2', [JSON.stringify(data), user.rows[0].id]);
				} catch (err) {
					console.error(err);
				}
				return data;
			}
			throw err;
		}
	};
	return s3;
}