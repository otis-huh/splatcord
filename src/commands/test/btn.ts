import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('btn')
		.setDescription('btn'),
	async execute(interaction: ChatInputCommandInteraction) {

		await interaction.deferReply();

		const btn_send = new ButtonBuilder()
			.setCustomId('send')
			.setLabel('Send friend request')
			.setStyle(ButtonStyle.Primary);

		const btn_accept = new ButtonBuilder()
			.setCustomId('accept')
			.setLabel('Accept friend request')
			.setStyle(ButtonStyle.Primary);

		const btn_accepted = new ButtonBuilder()
			.setCustomId('accept')
			.setLabel('Accepted friend request')
			.setStyle(ButtonStyle.Success)
			.setDisabled(true);

		const row_send = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(btn_send);

		const row_accept = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(btn_accept);

		const row_accepted = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(btn_accepted);

		const msg_send = await interaction.editReply({
			content: 'hi',
			components: [row_send],
		});

		const collector_send = msg_send.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10_000 });

		collector_send.on('collect', async send => {
			if (send.customId === 'send') {
				await send.update({ components: [row_send] });
				const msg_accept = await send.followUp({
					content: `<@${send.user.id}> sent a friend request.`,
					components: [row_accept],
				});

				const collector_accept = msg_accept.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10_000 });

				collector_accept.on('collect', async accept => {
					if (accept.customId === 'accept') {
						await accept.update({ components: [row_accepted] });
						await accept.followUp({
							content: `<@${send.user.id}> and <@${accept.user.id}> are now friends.`,
							components: [],
						});
					}
				});

				collector_accept.on('end', async () => {
					// this switches pressed disabled green "accepted" to disabled blue "accept" button
					// pls fix

					// const btn = ButtonBuilder.from(send.message.components[0].components[0] as APIButtonComponent).setDisabled(true);
					// const row = ActionRowBuilder.from(send.message.components[0] as APIActionRowComponent<APIButtonComponent>) as ActionRowBuilder<ButtonBuilder>;
					// row.setComponents(btn);
					row_accept.setComponents(btn_accept.setDisabled(true));
					await msg_accept.edit({ components: [row_accept] });
				});
			}
		});

		collector_send.on('end', async () => {
			row_send.setComponents(btn_send.setDisabled(true));
			await interaction.editReply({ components: [row_send] });
		});
	},
};