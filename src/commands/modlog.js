const { SlashCommandBuilder, PermissionFlagsBits } = require('@jubbio/core');
const { updateGuildSettings } = require('../utils/guild_settings');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlog')
        .setDescription('Modlog kanalini ayarla veya kapat')
        .addStringOption((option) =>
            option
                .setName('islem')
                .setDescription('Yapilacak islem')
                .setRequired(true)
                .addChoices(
                    { name: 'Ayarla', value: 'set' },
                    { name: 'Kapat', value: 'clear' }
                )
        )
        .addChannelOption((option) =>
            option
                .setName('kanal')
                .setDescription('Modlog mesaji gidecek kanal')
                .setRequired(false)
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

        if (action === 'set' && !channelId) {
            return interaction.reply({ embeds: [buildErrorEmbed('`Ayarla` secenegi icin kanal belirtmelisin.')], ephemeral: true });
        }

        if (action === 'set') {
            await updateGuildSettings(interaction.guildId, { modlogChannelId: channelId });
            return interaction.reply({
                embeds: [buildSuccessEmbed('Modlog Aktif', `Modlog kanali <#${channelId}> olarak ayarlandi.`)],
                ephemeral: true,
            });
        }

        await updateGuildSettings(interaction.guildId, { modlogChannelId: null });
        return interaction.reply({
            embeds: [buildSuccessEmbed('Modlog Kapatildi', 'Modlog artik mesaj gondermeyecek.')],
            ephemeral: true,
        });
    },
};
