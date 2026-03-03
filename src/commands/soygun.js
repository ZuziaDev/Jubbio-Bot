const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatDuration, formatMoney } = require('../utils/command_utils');
const {
    COOLDOWNS,
    addInventory,
    consumeShieldIfAny,
    getAccount,
    getCooldownLeft,
    grantXp,
    hasLockpick,
    saveAccount,
    setCooldown,
} = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soygun')
        .setDescription('Baska bir kullanicinin cuzdanini soymayi dener')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Soyulacak uye')
                .setRequired(true)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', true);
        if (String(targetUserId) === String(interaction.user.id)) {
            return interaction.reply({ content: 'Kendini soyamazsin.', ephemeral: true });
        }

        const attacker = await getAccount(interaction.guildId, interaction.user.id, { user: interaction.user });
        const target = await getAccount(interaction.guildId, targetUserId, { user: { username: `Kullanici ${targetUserId}` } });

        const left = getCooldownLeft(attacker, 'rob', COOLDOWNS.rob);
        if (left > 0) {
            return interaction.reply({
                content: `Yeni bir soygun denemesi icin **${formatDuration(left)}** beklemelisin.`,
                ephemeral: true,
            });
        }

        if (!hasLockpick(attacker)) {
            return interaction.reply({
                content: 'Soygun icin envanterinde `lockpick` olmasi gerekiyor.',
                ephemeral: true,
            });
        }

        if (target.wallet < 300) {
            return interaction.reply({
                content: 'Hedef kullanicinin cuzdani cok dusuk. Soygun icin uygun degil.',
                ephemeral: true,
            });
        }

        setCooldown(attacker, 'rob');

        const blockedByShield = consumeShieldIfAny(target);
        if (blockedByShield) {
            addInventory(attacker, 'lockpick', -1);
            await saveAccount(interaction.guildId, interaction.user.id, attacker);
            await saveAccount(interaction.guildId, targetUserId, target);

            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Soygun Engellendi')
                .setDescription(`Hedef kullanici shield kullandi. Lockpickin kirildi.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        const success = Math.random() < 0.4;
        if (!success) {
            const penalty = Math.min(attacker.wallet, Math.floor(Math.random() * 301) + 120);
            attacker.wallet -= penalty;
            attacker.stats.lost += penalty;

            await saveAccount(interaction.guildId, interaction.user.id, attacker);
            await saveAccount(interaction.guildId, targetUserId, target);

            const embed = new EmbedBuilder()
                .setColor(Colors.DarkRed)
                .setTitle('Soygun Basarisiz')
                .setDescription(`Yakalandin ve **${formatMoney(penalty)}** ceza odedin.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        const stealCap = Math.max(300, Math.floor(target.wallet * 0.4));
        const stolen = Math.min(target.wallet, Math.floor(Math.random() * Math.min(1500, stealCap)) + 200);

        target.wallet -= stolen;
        target.stats.robbedBy += stolen;
        attacker.wallet += stolen;
        attacker.stats.robbed += stolen;

        const xpInfo = grantXp(attacker, stolen);

        await saveAccount(interaction.guildId, interaction.user.id, attacker);
        await saveAccount(interaction.guildId, targetUserId, target);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Soygun Basarili')
            .setDescription(`<@${targetUserId}> kullanicisindan **${formatMoney(stolen)}** caldin.`)
            .addFields(
                { name: 'Senin Cuzdanin', value: formatMoney(attacker.wallet), inline: true },
                { name: 'Hedef Cuzdan', value: formatMoney(target.wallet), inline: true },
                { name: 'XP', value: `+${xpInfo.xpGain}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
