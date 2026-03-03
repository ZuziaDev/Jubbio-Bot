const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');

const ANSWERS = [
    'Kesinlikle evet.',
    'Buyuk ihtimalle olacak.',
    'Su an iyi gorunuyor.',
    'Biraz daha bekle ve tekrar sor.',
    'Bu konuda emin degilim.',
    'Pek sanmiyorum.',
    'Kesinlikle hayir.',
    'Kader su an sisli.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fal')
        .setDescription('8ball tarzinda rastgele cevap verir')
        .addStringOption((option) =>
            option
                .setName('soru')
                .setDescription('Sormak istedigin soru')
                .setRequired(true)
                .setMaxLength(200)
        ),

    async execute(client, interaction) {
        const question = interaction.options.getString('soru', true);
        const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

        const embed = new EmbedBuilder()
            .setColor(Colors.Purple)
            .setTitle('Fal Kuresi')
            .addFields(
                { name: 'Soru', value: question, inline: false },
                { name: 'Cevap', value: answer, inline: false }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
