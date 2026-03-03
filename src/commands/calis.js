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

const JOBS = [
    'freelance kod yazdin',
    'sunucu optimize ettin',
    'logo tasarladin',
    'bir bot bugini kapattin',
    'komut sistemi gelistirdin',
    'sunucuya destek verdin',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calis')
        .setDescription('Calisip para kazanirsin'),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const left = getCooldownLeft(account, 'work', COOLDOWNS.work);
        if (left > 0) {
            return interaction.reply({
                content: `Tekrar calismak icin **${formatDuration(left)}** beklemelisin.`,
                ephemeral: true,
            });
        }

        const base = Math.floor(Math.random() * 551) + 250;
        const total = applyLuckBoost(account, base);
        const jobText = JOBS[Math.floor(Math.random() * JOBS.length)];

        account.wallet += total;
        account.stats.earned += total;
        setCooldown(account, 'work');

        const xpInfo = grantXp(account, total);
        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle('Mesai Tamamlandi')
            .setDescription(`Bugun ${jobText} ve **${formatMoney(total)}** kazandin.`)
            .addFields(
                { name: 'Yeni Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'XP', value: `+${xpInfo.xpGain}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
