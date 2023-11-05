import { ChatInputCommandInteraction, SlashCommandBuilder, codeBlock } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('sr')
		.setDescription('Show salmon run schedule.'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();


		const response = await fetch('https://splatoon.oatmealdome.me/api/v1/three/coop/phases?count=1');
		if (!response.ok) {
			await interaction.editReply(`HTTP error: ${response.status}`);
		} else {
			const result = await response.json();
			const json = JSON.stringify(result);
			console.log(json);


			await interaction.editReply(codeBlock(json));
		}
	},
};