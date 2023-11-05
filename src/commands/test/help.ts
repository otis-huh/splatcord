import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Show help.'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		async function listCommands() {
			const commands = await interaction.client.application.commands.fetch();
			const sort: string[] = [];
			let msg = '';
			for (const value of commands.values()) {
				sort.push(`</${value.name}:${value.id}>: ${value.description}`);
			}
			sort.sort().forEach((value) => {
				msg = msg + value + '\n';
			});
			return msg;
		}
		await interaction.editReply(await listCommands());
	},
};