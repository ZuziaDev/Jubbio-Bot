const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatDuration, formatMoney } = require('../utils/command_utils');
const {
    COOLDOWNS,
    applyLuckBoost,
    getAccount,
    getCooldownLeft,
    grantXp,
    saveAccount,
    setCooldown,
} = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunluk')
        .setDescription('Gunluk odulunu toplarsin'),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const left = getCooldownLeft(account, 'daily', COOLDOWNS.daily);
        if (left > 0) {
            return interaction.reply({
                content: `Gunluk odulu zaten aldin. Tekrar denemek icin **${formatDuration(left)}** beklemelisin.`,
                ephemeral: true,
            });
        }

        const base = Math.floor(Math.random() * 401) + 350;
        const streakBonus = Math.min(500, account.streaks.daily * 25);
        const total = applyLuckBoost(account, base + streakBonus);

        account.wallet += total;
        account.stats.earned += total;

        const oneDayGap = 24 * 60 * 60 * 1000;
        if (Date.now() - account.streaks.lastDailyAt <= oneDayGap * 2) {
            account.streaks.daily += 1;
        } else {
            account.streaks.daily = 1;
        }

        account.streaks.lastDailyAt = Date.now();
        setCooldown(account, 'daily');

        const xpInfo = grantXp(account, total);
        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Gunluk Odul Alindi')
            .setDescription(`Kasana **${formatMoney(total)}** eklendi.`)
            .addFields(
                { name: 'Streak', value: `${account.streaks.daily} gun`, inline: true },
                { name: 'Yeni Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'XP Kazanci', value: `+${xpInfo.xpGain}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
