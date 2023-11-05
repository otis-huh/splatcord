import { ChatInputCommandInteraction, SlashCommandBuilder, inlineCode } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check the ping.'),
	async execute(interaction: ChatInputCommandInteraction) {
		const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
		interaction.editReply(`Roundtrip latency: ${inlineCode(`${sent.createdTimestamp - interaction.createdTimestamp}ms`)}`);
	},
};