const { SlashCommandBuilder, PermissionFlagsBits, Colors } = require('@jubbio/core');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Kullanicinin timeout durumunu kaldirir')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Timeout kaldirilacak uye')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('sebep')
                .setDescription('Neden kaldirildigi')
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
        const reason = interaction.options.getString('sebep', false) || 'Belirtilmedi';

        await client.rest.timeoutMember(interaction.guildId, targetUserId, null, reason);

        await sendModLog(client, interaction.guildId, {
            color: Colors.Green,
            title: 'Timeout Kaldirildi',
            description: `<@${targetUserId}> timeout cezasindan cikarildi.`,
            fields: [
                { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Sebep', value: reason, inline: false },
            ],
        });

        return interaction.reply({
            embeds: [buildSuccessEmbed('Islem Basarili', `<@${targetUserId}> kullanicisinin timeoutu kaldirildi.`)],
            ephemeral: true,
        });
    },
};
