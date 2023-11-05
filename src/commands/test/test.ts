import { ChatInputCommandInteraction, SlashCommandBuilder, inlineCode } from 'discord.js';
import { isUser, getUser, getTokens } from '../../nxapi.js';

export default {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Test coral and splatnet2 and splatnet3.'),
	async execute(interaction: ChatInputCommandInteraction) {


		await interaction.deferReply();
		if (!await isUser(interaction.user.id)) {
			await interaction.editReply(`Please authorize using ${inlineCode('/auth')}`);
		} else {
			const user = await getUser(interaction.user.id);
			const { coral, s2, s3 } = await getTokens(user!);


			const friendcode = (await coral.getFriendCodeUrl()).friendCode;
			const wins_s2 = (await s2?.getRecords())?.records.recent_win_count;
			const wins_s3 = (await s3?.getLatestBattleHistoriesRefetch())?.data.latestBattleHistories.summary.win;
			// console.log(JSON.stringify(friendcode));
			await interaction.editReply(friendcode + '\nLatests wins s2:' + wins_s2 + '\nLatests wins s3:' + wins_s3);
		}
	},
};