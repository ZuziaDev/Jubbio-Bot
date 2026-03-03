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
        .setName('suc')
        .setDescription('Riskli para kazanma denemesi yaparsin'),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const left = getCooldownLeft(account, 'crime', COOLDOWNS.crime);
        if (left > 0) {
            return interaction.reply({
                content: `Yeni bir suc denemesi icin **${formatDuration(left)}** beklemelisin.`,
                ephemeral: true,
            });
        }

        const success = Math.random() < 0.55;
        const amount = Math.floor(Math.random() * 751) + 300;
        setCooldown(account, 'crime');

        if (success) {
            const gain = applyLuckBoost(account, amount);
            account.wallet += gain;
            account.stats.earned += gain;

            const xpInfo = grantXp(account, gain);
            await saveAccount(interaction.guildId, interaction.user.id, account);

            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle('Operasyon Basarili')
                .setDescription(`Operasyon temiz bitti, **${formatMoney(gain)}** kazandin.`)
                .addFields(
                    { name: 'Cuzdan', value: formatMoney(account.wallet), inline: true },
                    { name: 'XP', value: `+${xpInfo.xpGain}`, inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        const loss = Math.min(account.wallet, Math.floor(amount * 0.7));
        account.wallet -= loss;
        account.stats.lost += loss;

        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('Operasyon Basarisiz')
            .setDescription(`Yakalandin ve **${formatMoney(loss)}** ceza odedin.`)
            .addFields({ name: 'Yeni Cuzdan', value: formatMoney(account.wallet), inline: true })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
