const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatMoney } = require('../utils/command_utils');
const { getAccount, getNetWorth, isLuckyBoostActive } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Kullanici bakiyesini gosterir')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Bakiyesi gorulecek uye')
                .setRequired(false)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', false) || interaction.user.id;
        const username = targetUserId === interaction.user.id ? interaction.user.username : `Kullanici ${targetUserId}`;

        const account = await getAccount(interaction.guildId, targetUserId, {
            user: { username },
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.Gold)
            .setTitle('Ekonomi Bakiyesi')
            .setDescription(`<@${targetUserId}> icin finans ozeti`)
            .addFields(
                { name: 'Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'Banka', value: formatMoney(account.bank), inline: true },
                { name: 'Toplam', value: formatMoney(getNetWorth(account)), inline: true },
                { name: 'Seviye', value: `${account.level} (XP: ${account.xp})`, inline: true },
                { name: 'Gunun Serisi', value: String(account.streaks.daily), inline: true },
                { name: 'Bonus', value: isLuckyBoostActive(account) ? 'Lucky Charm aktif' : 'Yok', inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
