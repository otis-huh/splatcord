import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, inlineCode } from 'discord.js';
import { isUser, getUser, getTokens } from '../../nxapi.js';

export default {
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Lookup user with friend code.')
		.addStringOption(option =>
			option.setName('friendcode')
				.setDescription('Please provide a friendcode.')
				.setRequired(true)),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		if (!await isUser(interaction.user.id)) {
			await interaction.editReply(`Please authorize using ${inlineCode('/auth')}`);
		} else {
			try {
				const user = await getUser(interaction.user.id);
				const { coral } = await getTokens(user!);
				const friendcode = /^\d{4}-\d{4}-\d{4}$/;
				if (!friendcode.test(interaction.options.getString('friendcode')!)) {
					throw 'Invalid friend code.';
				}
				const lookup = await coral.getUserByFriendCode(interaction.options.getString('friendcode')!);

				const embed = new EmbedBuilder()
					.setTitle(lookup.name)
					.setThumbnail(lookup.imageUri)
					.addFields(
						{ name: 'Coral User ID', value: lookup.id.toString(), inline: true },
						{ name: 'NSA ID', value: lookup.nsaId, inline: true },
					)
					.setFooter({ text: interaction.user.tag, iconURL: interaction.user.avatarURL()! })
					.setTimestamp();

				await interaction.editReply({ embeds: [embed] });
			} catch (err) {
				console.log(err);
				await interaction.editReply(`Invalid friendcode. Make sure that the user exists and to use the following format: ${inlineCode('0000-0000-0000')}`);
			}
		}
	},
};