import { ChatInputCommandInteraction, SlashCommandBuilder, inlineCode } from 'discord.js';
import { authUrl, isUser, createTokens } from '../../nxapi.js';
import { pool } from '../../db.js';

const info = `# Disclaimer\nUsing the nso module requires sending an authentication token to third-party APIs. For more information:\n<https://github.com/otis-huh/splatcord#nso-authentication> \n\n# Usage\n Do ${inlineCode('/auth generate')}\n`;
const step1 = '1. Open the link and login to your Nintendo Account.\n';
const step2 = `2. On the "Linking an External Account" page, right click "Select this person" and copy the link. It should start with "npf71b963c1b7b6d119://auth".\n3. Paste the link in the next command:\n - ${inlineCode('/auth new')} for new users\n - ${inlineCode('/auth renew')} for existing users`;

export default {
	data: new SlashCommandBuilder()
		.setName('auth')
		.setDescription('Authenticate to nso app.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('info')
				.setDescription('Information about the authentication process.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('generate')
				.setDescription('Generate authentication link.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('new')
				.setDescription('Authenticate user')
				.addStringOption(option =>
					option.setName('link')
						.setDescription('Please provide the link.')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('renew')
				.setDescription('Update user.')
				.addStringOption(option =>
					option.setName('link')
						.setDescription('Please provide the link.')
						.setRequired(true))),
	async execute(interaction: ChatInputCommandInteraction) {
		if (interaction.options.getSubcommand() === 'info') {
			await interaction.reply({ content: info + step1 + step2, ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'generate') {
			await interaction.deferReply({ ephemeral: true });
			await interaction.editReply(step1 + ` - [link](${authUrl()})` + '\n' + step2);
		} else if (interaction.options.getSubcommand() === 'new') {
			try {
				await interaction.deferReply({ ephemeral: true });
				const user = await pool.query('SELECT * FROM users WHERE id = $1', [interaction.user.id]);
				if (!user?.rows[0]) {
					await pool.query('INSERT INTO users (id) VALUES ($1)', [interaction.user.id]);
					await createTokens(interaction);
					await interaction.editReply('Done!');
				} else {
					await interaction.editReply(`User is already in the database. If you want to renew your session token, please use ${inlineCode('/auth renew')}`);
				}
			} catch (err) {
				console.error(err);
			}
		} else if (interaction.options.getSubcommand() === 'renew') {
			try {
				await interaction.deferReply({ ephemeral: true });
				if (!await isUser(interaction.user.id)) {
					await interaction.editReply(`User isn't in the database yet. Please use ${inlineCode('/auth new')}`);
				} else {
					await createTokens(interaction);
					await interaction.editReply('Done!');
				}
			} catch (err) {
				console.error(err);
			}
		}
	},
};