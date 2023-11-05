import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

let user_id: string;

export default {
	data: new SlashCommandBuilder()
		.setName('lookup-s')
		.setDescription('Lookup sendou.ink user.')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('Select other user.')
				.setRequired(false)),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		// do nullish coalescing operator instead?
		if (!interaction.options.getUser('user')) {
			user_id = interaction.user.id;
		} else {
			user_id = interaction.options.getUser('user')!.id;
		}

		const response = await fetch(`https://sendou.ink/u?q=${user_id}&_data=routes/u`);
		if (!response.ok) {
			await interaction.editReply(`HTTP error: ${response.status}`);
		} else {
			const result = await response.json();
			const user = result.users[0];

			if (user) {
				const embed = new EmbedBuilder()
					.setTitle(user.discordName)
					.setURL(`https://sendou.ink/u/${user.discordId}`)
					.setDescription(user.discordDiscriminator === '0' && user.showDiscordUniqueName !== 0 ? user.discordUniqueName : `${user.discordName}#${user.discordDiscriminator}`)
					.setThumbnail(`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}`)
					.addFields(
						{ name: 'ID', value: user.id.toString(), inline: true },
						{ name: 'Custom URL', value: user.customUrl?.toString() ?? 'null', inline: true },
						{ name: 'IGN', value: user.inGameName?.toString() ?? 'null', inline: true },
						{ name: 'Plus Server', value: user.plusTier?.toString() ?? 'null', inline: true },
					)
					.setFooter({ text: interaction.user.tag, iconURL: interaction.user.avatarURL()! })
					.setTimestamp();

				await interaction.editReply({ embeds: [embed] });
			} else {
				await interaction.editReply('No user found.');
			}
		}
	},
};