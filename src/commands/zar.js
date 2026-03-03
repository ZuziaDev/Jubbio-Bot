const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zar')
        .setDescription('Rastgele zar atar')
        .addIntegerOption((option) =>
            option
                .setName('yuz')
                .setDescription('Zar kac yuzlu olsun? (2-1000)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(1000)
        ),

    async execute(client, interaction) {
        const faces = interaction.options.getInteger('yuz', false) || 6;
        const result = Math.floor(Math.random() * faces) + 1;

        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('Zar Sonucu')
            .setDescription(`1-${faces} arasinda gelen sayi: **${result}**`)
            .setFooter({ text: `Istek sahibi: ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
