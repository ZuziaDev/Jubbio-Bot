const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { getLeaderboard } = require('../utils/economy');
const { formatMoney } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('liderlik')
        .setDescription('Sunucudaki ekonomi liderlik tablosunu gosterir')
        .addIntegerOption((option) =>
            option
                .setName('limit')
                .setDescription('Liste uzunlugu (3-20)')
                .setRequired(false)
                .setMinValue(3)
                .setMaxValue(20)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const limit = interaction.options.getInteger('limit', false) || 10;
        const leaderboard = await getLeaderboard(interaction.guildId, limit);

        if (leaderboard.length === 0) {
            return interaction.reply({ content: 'Liderlik tablosu henuz bos.' });
        }

        const lines = leaderboard.map((entry, index) => {
            const rank = index + 1;
            return `${rank}. <@${entry.userId}> - ${formatMoney(entry.netWorth)} (Seviye ${entry.level})`;
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.Gold)
            .setTitle('Ekonomi Liderlik')
            .setDescription(lines.join('\n'))
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
