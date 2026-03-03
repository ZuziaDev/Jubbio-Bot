const { SlashCommandBuilder, PermissionFlagsBits } = require('@jubbio/core');
const { updateGuildSettings } = require('../utils/guild_settings');
const { buildErrorEmbed, buildSuccessEmbed, hasPermission } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otorol')
        .setDescription('Sunucuya giren kullanicilara otomatik rol verir')
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
        .addRoleOption((option) =>
            option
                .setName('rol')
                .setDescription('Yeni uyeye verilecek rol')
                .setRequired(false)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut sadece sunucularda kullanilabilir.')], ephemeral: true });
        }

        if (!hasPermission(interaction, PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ embeds: [buildErrorEmbed('Bu komut icin `Rolleri Yonet` yetkisi gerekiyor.')], ephemeral: true });
        }

        const action = interaction.options.getString('islem', true);
        const roleId = interaction.options.getString('rol', false);

        if (action === 'set') {
            if (!roleId) {
                return interaction.reply({ embeds: [buildErrorEmbed('Ayarla secenegi icin bir rol secmelisin.')], ephemeral: true });
            }

            await updateGuildSettings(interaction.guildId, { autoroleId: roleId });
            return interaction.reply({ embeds: [buildSuccessEmbed('Otorol Aktif', `Yeni uyeye otomatik <@&${roleId}> rolu verilecek.`)], ephemeral: true });
        }

        await updateGuildSettings(interaction.guildId, { autoroleId: null });
        return interaction.reply({ embeds: [buildSuccessEmbed('Otorol Kapatildi', 'Artik otomatik rol verilmeyecek.')], ephemeral: true });
    },
};
