const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('@jubbio/core');
const { buildHelpEmbed } = require('../utils/help_center');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardim')
        .setDescription('Komut kategorilerini secmeli yardim menusu ile gosterir'),
    async execute(client, interaction) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Bir kategori sec')
            .addOptions(
                { label: 'Sistem', value: 'sistem', description: 'Kurulum ve ayarlar' },
                { label: 'Moderasyon', value: 'moderasyon', description: 'Yonetim komutlari' },
                { label: 'Ekonomi', value: 'ekonomi', description: 'Para, market, liderlik' },
                { label: 'Eglence', value: 'eglence', description: 'Zar, yazi-tura, anket' }
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            embeds: [buildHelpEmbed('sistem')],
            components: [row],
            ephemeral: true,
        });
    },
};
