const { SlashCommandBuilder, PermissionFlagsBits, Colors } = require('@jubbio/core');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission, formatDuration } = require('../utils/command_utils');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Kullaniciyi gecici olarak susturur')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Susturulacak uye')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('sure_dk')
                .setDescription('Susturma suresi (dakika)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10080)
        )
        .addStringOption((option) =>
            option
                .setName('sebep')
                .setDescription('Susturma nedeni')
                .setRequired(false)
                .setMaxLength(200)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucularda kullanilabilir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Uyeleri Sustur` yetkisi gerekiyor.')], ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', true);
        const durationMinutes = interaction.options.getInteger('sure_dk', true);
        const reason = interaction.options.getString('sebep', false) || 'Belirtilmedi';

        if (String(targetUserId) === String(interaction.user.id)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Kendine timeout atamazsin.')], ephemeral: true });
        }

        const durationMs = durationMinutes * 60 * 1000;
        await client.rest.timeoutMember(interaction.guildId, targetUserId, durationMs, reason);

        await sendModLog(client, interaction.guildId, {
            color: Colors.DarkGold,
            title: 'Timeout Islemi',
            description: `<@${targetUserId}> susturuldu.`,
            fields: [
                { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Sure', value: formatDuration(durationMs), inline: true },
                { name: 'Sebep', value: reason, inline: false },
            ],
        });

        return interaction.reply({
            embeds: [buildSuccessEmbed('Timeout Basarili', `<@${targetUserId}> kullanicisi ${formatDuration(durationMs)} susturuldu.`)],
            ephemeral: true,
        });
    },
};
