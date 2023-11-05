import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
	user: `${process.env.PGUSER}`,
	password: `${process.env.PGPASSWORD}`,
	database: `${process.env.PGDATABASE}`,
	port: 5432,
	host: `${process.env.PGHOST}`,
});