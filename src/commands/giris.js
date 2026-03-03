const { SlashCommandBuilder, PermissionFlagsBits } = require('@jubbio/core');
const { updateGuildSettings } = require('../utils/guild_settings');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giris')
        .setDescription('Giris kanalini veya giris mesajini ayarlar')
        .addStringOption((option) =>
            option
                .setName('islem')
                .setDescription('Yapilacak islem')
                .setRequired(true)
                .addChoices(
                    { name: 'Kanal Ayarla', value: 'set_channel' },
                    { name: 'Mesaj Ayarla', value: 'set_message' },
                    { name: 'Kapat', value: 'disable' }
                )
        )
        .addChannelOption((option) =>
            option
                .setName('kanal')
                .setDescription('Giris mesaji gidecek kanal')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('mesaj')
                .setDescription('Sablon mesaj ({user}, {server}, {count})')
                .setRequired(false)
                .setMaxLength(300)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucularda kullanilabilir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Sunucuyu Yonet` yetkisi gerekiyor.')], ephemeral: true });
        }

        const action = interaction.options.getString('islem', true);
        const channelId = interaction.options.getChannel('kanal', false);
        const message = interaction.options.getString('mesaj', false);

        if (action === 'set_channel') {
            if (!channelId) {
                return interaction.reply({ embeds: [buildErrorEmbed('Kanal secmeden ayarlama yapamazsin.')], ephemeral: true });
            }
            await updateGuildSettings(interaction.guildId, { welcomeChannelId: channelId });
            return interaction.reply({ embeds: [buildSuccessEmbed('Giris Kanali Ayarlandi', `Yeni uye mesajlari artik <#${channelId}> kanalina gidecek.`)], ephemeral: true });
        }

        if (action === 'set_message') {
            if (!message) {
                return interaction.reply({ embeds: [buildErrorEmbed('Mesaj metni girmelisin.')], ephemeral: true });
            }
            await updateGuildSettings(interaction.guildId, { welcomeMessage: message });
            return interaction.reply({ embeds: [buildSuccessEmbed('Giris Mesaji Ayarlandi', `Yeni sablon:\n${message}`)], ephemeral: true });
        }

        await updateGuildSettings(interaction.guildId, {
            welcomeChannelId: null,
            welcomeMessage: 'Hos geldin {user}, {server} sunucusuna katildin!',
        });

        return interaction.reply({ embeds: [buildSuccessEmbed('Giris Sistemi Kapatildi', 'Giris mesaji gonderimi kapatildi.')], ephemeral: true });
    },
};
