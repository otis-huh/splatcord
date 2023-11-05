import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes, RESTPutAPIApplicationCommandsResult } from 'discord.js';

dotenv.config();

const commands = [];
const foldersPath = './dist/commands';
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(`../${filePath}`);
		if ('data' in command.default && 'execute' in command.default) {
			commands.push(command.default.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID!),
			{ body: commands },
		) as RESTPutAPIApplicationCommandsResult;

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();