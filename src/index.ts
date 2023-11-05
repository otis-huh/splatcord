import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

dotenv.config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		// GatewayIntentBits.GuildMembers,
		// GatewayIntentBits.GuildMessages,
		// GatewayIntentBits.MessageContent,
	],
});

declare module 'discord.js' {
	// eslint-disable-next-line no-shadow
	export interface Client {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		commands: Collection<unknown, any>;
	}
  }

client.commands = new Collection();
const foldersPath = './dist/commands';
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(`../${filePath}`);
		if ('data' in command.default && 'execute' in command.default) {
			client.commands.set(command.default.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = './dist/events';
const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = await import(`../${filePath}`);
	if (event.default.once) {
		client.once(event.default.name, (...args) => event.default.execute(...args));
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

client.login(process.env.DISCORD_TOKEN);