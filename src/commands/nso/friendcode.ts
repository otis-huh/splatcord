import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, hyperlink, inlineCode } from 'discord.js';
import { isUser, getUser, getTokens } from '../../nxapi.js';

let user_id: string;

async function userData(id: string) {
	const user = await getUser(id);
	const tokens = await getTokens(user!);
	const fc = await tokens.coral.getFriendCodeUrl();
	const nsa_id = (await tokens.coral.getUserByFriendCode(fc.friendCode)).nsaId;

	return { tokens, fc, nsa_id };
}

export default {
	data: new SlashCommandBuilder()
		.setName('friendcode')
		.setDescription('Get friend code.')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('Select other user.')
				.setRequired(false)),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		if (!interaction.options.getUser('user')) {
			user_id = interaction.user.id;
		} else {
			user_id = interaction.options.getUser('user')!.id;
		}

		if (!await isUser(user_id)) {
			await interaction.editReply('User isn\'t in the database yet.');
		} else {
			const receiver = await userData(user_id);

			const btn_send = new ButtonBuilder()
				.setCustomId('fr-send')
				.setLabel('Send friend request')
				.setStyle(ButtonStyle.Primary);

			const btn_accept = new ButtonBuilder()
				.setCustomId('fr-accept')
				.setLabel('Accept friend request')
				.setStyle(ButtonStyle.Primary);

			const btn_accepted = new ButtonBuilder()
				.setCustomId('fr-accepted')
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
				content: hyperlink(receiver.fc.friendCode, receiver.fc.url),
				components: [row_send],
			});

			const filter_send = async function(interaction_send: ButtonInteraction) {
				return await isUser(interaction_send.user.id) && interaction_send.user.id !== user_id;
			};

			const filter_accept = async function(interaction_accept: ButtonInteraction) {
				return interaction_accept.user.id === user_id;
			};

			const collector_send = msg_send.createMessageComponentCollector({ componentType: ComponentType.Button, filter: filter_send, time: 600_000 });

			collector_send.on('collect', async send => {
				if (send.customId === 'fr-send') {
					await send.update({ components: [row_send] });

					if (!await isUser(send.user.id)) {
						await send.followUp({ content: `Please authorize using ${inlineCode('/auth')}`, ephemeral: true });
					} else {
						const sender = await userData(send.user.id);
						await sender.tokens.coral.sendFriendRequest(receiver.nsa_id);

						const msg_accept = await send.followUp({
							content: `<@${send.user.id}> sent <@${user_id}> a friend request.`,
							components: [row_accept],
						});

						const collector_accept = msg_accept.createMessageComponentCollector({ componentType: ComponentType.Button, filter: filter_accept, time: 600_000 });

						collector_accept.on('collect', async accept => {
							if (accept.customId === 'fr-accept') {
								await accept.update({ components: [row_accepted] });

								await receiver.tokens.coral.sendFriendRequest(sender.nsa_id);

								await accept.followUp({
									content: `<@${send.user.id}> and <@${user_id}> are now friends.`,
									components: [],
								});
							}
						});

						collector_accept.on('end', async () => {
							// this switches pressed disabled green "accepted" to disabled blue "accept" button
							// pls fix
							row_accept.setComponents(btn_accept.setDisabled(true));
							await msg_accept.edit({ components: [row_accept] });
						});
					}
				}
			});

			collector_send.on('end', async () => {
				row_send.setComponents(btn_send.setDisabled(true));
				await interaction.editReply({ components: [row_send] });
			});
		}
	},
};