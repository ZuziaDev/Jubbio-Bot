const { SlashCommandBuilder, PermissionFlagsBits, Colors } = require('@jubbio/core');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullaniciyi sunucudan yasaklar')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Yasaklanacak uye')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('sebep')
                .setDescription('Yasaklama nedeni')
                .setRequired(false)
                .setMaxLength(200)
        )
        .addIntegerOption((option) =>
            option
                .setName('mesaj_gun')
                .setDescription('Kac gunluk mesaj silinsin (0-7)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucularda kullanilabilir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Uyeleri Yasakla` yetkisi gerekiyor.')], ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', true);
        const reason = interaction.options.getString('sebep', false) || 'Belirtilmedi';
        const deleteDays = interaction.options.getInteger('mesaj_gun', false) || 0;

        if (String(targetUserId) === String(interaction.user.id)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Kendini yasaklayamazsin.')], ephemeral: true });
        }

        await client.rest.banMember(interaction.guildId, targetUserId, {
            deleteMessageDays: deleteDays,
            reason,
        });

        await sendModLog(client, interaction.guildId, {
            color: Colors.Red,
            title: 'Ban Islemi',
            description: `<@${targetUserId}> yasaklandi.`,
            fields: [
                { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Mesaj Silme', value: `${deleteDays} gun`, inline: true },
                { name: 'Sebep', value: reason, inline: false },
            ],
        });

        return interaction.reply({
            embeds: [buildSuccessEmbed('Ban Basarili', `<@${targetUserId}> sunucudan yasaklandi.`)],
            ephemeral: true,
        });
    },
};
