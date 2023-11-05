import { BaseInteraction, Events } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	async execute(interaction: BaseInteraction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.default.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		} else if (interaction.isButton()) {
			if (interaction.customId === 'a') {
				console.log('a');
			}
		} else {
			return;
		}
	},
};