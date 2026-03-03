const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatMoney } = require('../utils/command_utils');
const {
    getAccount,
    getBankCapacity,
    getInventoryLines,
    getNetWorth,
    isLuckyBoostActive,
} = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Gelismis ekonomi profil karti')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Profili gorulecek uye')
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

        const inventoryPreview = getInventoryLines(account).slice(0, 4).join('\n');
        const capacity = getBankCapacity(account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('Ekonomi Profili')
            .setDescription(`<@${targetUserId}> finans paneli`)
            .addFields(
                { name: 'Net Deger', value: formatMoney(getNetWorth(account)), inline: true },
                { name: 'Seviye', value: `${account.level} (XP ${account.xp})`, inline: true },
                { name: 'Gunluk Streak', value: `${account.streaks.daily} gun`, inline: true },
                { name: 'Cuzdan / Banka', value: `${formatMoney(account.wallet)} / ${formatMoney(account.bank)}`, inline: false },
                { name: 'Banka Kapasitesi', value: `${formatMoney(account.bank)} / ${formatMoney(capacity)}`, inline: false },
                { name: 'Bonus Durumu', value: isLuckyBoostActive(account) ? 'Lucky Charm aktif' : 'Bonus yok', inline: true },
                { name: 'Kasadaki Esya', value: inventoryPreview || 'Envanter bos', inline: false }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
