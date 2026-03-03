const { SlashCommandBuilder, PermissionFlagsBits, Colors } = require('@jubbio/core');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullaniciyi sunucudan atar')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Atilacak uye')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('sebep')
                .setDescription('Atma nedeni')
                .setRequired(false)
                .setMaxLength(200)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucularda kullanilabilir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Uyeleri At` yetkisi gerekiyor.')], ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', true);
        const reason = interaction.options.getString('sebep', false) || 'Belirtilmedi';

        if (String(targetUserId) === String(interaction.user.id)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Kendini atamazsin.')], ephemeral: true });
        }

        await client.rest.kickMember(interaction.guildId, targetUserId, reason);

        await sendModLog(client, interaction.guildId, {
            color: Colors.Orange,
            title: 'Kick Islemi',
            description: `<@${targetUserId}> sunucudan atildi.`,
            fields: [
                { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Sebep', value: reason, inline: false },
            ],
        });

        return interaction.reply({
            embeds: [buildSuccessEmbed('Kick Basarili', `<@${targetUserId}> sunucudan atildi.`)],
            ephemeral: true,
        });
    },
};
