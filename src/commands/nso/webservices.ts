import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, inlineCode } from 'discord.js';
import { isUser, getUser, getTokens } from '../../nxapi.js';

export default {
	data: new SlashCommandBuilder()
		.setName('webservices')
		.setDescription('List nso app web services.'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		if (!await isUser(interaction.user.id)) {
			await interaction.editReply(`Please authorize using ${inlineCode('/auth')}`);
		} else {
			const user = await getUser(interaction.user.id);
			const { coral } = await getTokens(user!);
			const webservices = await coral.getWebServices();
			const embeds = [];
			for (const webservice of webservices) {
				const embed = new EmbedBuilder()
					.setTitle(webservice.name)
					.setURL(webservice.uri)
					.setThumbnail(webservice.imageUri)
					.addFields(
						{ name: 'ID', value: webservice.id.toString(), inline: true },
					)
					.setFooter({ text: interaction.user.tag, iconURL: interaction.user.avatarURL()! })
					.setTimestamp();

				embeds.push(embed);
			}
			await interaction.editReply({ embeds: embeds });
		}
	},
};