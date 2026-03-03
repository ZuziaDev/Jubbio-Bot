const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { getAccount, getInventoryLines } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('envanter')
        .setDescription('Kullanicinin envanterini gosterir')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Envanteri gorulecek uye')
                .setRequired(false)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', false) || interaction.user.id;
        const username = targetUserId === interaction.user.id ? interaction.user.username : `Kullanici ${targetUserId}`;

        const account = await getAccount(interaction.guildId, targetUserId, {
            user: { username },
        });

        const lines = getInventoryLines(account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('Envanter')
            .setDescription(`<@${targetUserId}> icin envanter listesi`)
            .addFields({ name: 'Urunler', value: lines.join('\n'), inline: false })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
