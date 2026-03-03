const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yazitura')
        .setDescription('Yazi tura atar'),

    async execute(client, interaction) {
        const result = Math.random() < 0.5 ? 'Yazi' : 'Tura';

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('Yazi Tura')
            .setDescription(`Sonuc: **${result}**`)
            .setFooter({ text: `Istek sahibi: ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
