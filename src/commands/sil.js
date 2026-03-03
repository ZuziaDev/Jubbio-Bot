const { SlashCommandBuilder, PermissionFlagsBits, Colors } = require('@jubbio/core');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Bulundugun kanaldan toplu mesaj temizler')
        .addIntegerOption((option) =>
            option
                .setName('miktar')
                .setDescription('Silinecek mesaj adedi (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId || !interaction.channelId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucu metin kanallarinda calisir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Mesajlari Yonet` yetkisi gerekiyor.')], ephemeral: true });
        }

        const amount = interaction.options.getInteger('miktar', true);

        const messages = await client.rest.getMessages(interaction.guildId, interaction.channelId, {
            limit: amount,
        });

        const messageIds = messages.map((msg) => msg.id).filter(Boolean);

        if (messageIds.length === 0) {
            return interaction.reply({ embeds: [buildErrorEmbed('Silinecek uygun mesaj bulunamadi.')], ephemeral: true });
        }

        await client.rest.bulkDeleteMessages(interaction.guildId, interaction.channelId, messageIds);

        await sendModLog(client, interaction.guildId, {
            color: Colors.DarkRed,
            title: 'Toplu Mesaj Silme',
            description: `<#${interaction.channelId}> kanalindan ${messageIds.length} mesaj temizlendi.`,
            fields: [
                { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Miktar', value: String(messageIds.length), inline: true },
            ],
        });

        return interaction.reply({
            embeds: [buildSuccessEmbed('Temizleme Tamam', `${messageIds.length} mesaj silindi.`)],
            ephemeral: true,
        });
    },
};
