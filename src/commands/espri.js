const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');

const JOKES = [
    'Yazilimci neden denize dusmus? Cunku buglari ayikliyormus.',
    'Bilgisayar neden soguk? Cunku tum pencereleri acik kalmis.',
    'Kodum calismiyor diye uzulme, en azindan derleniyor olabilir.',
    'Programci kahvaltiya neden gec kalir? Cunku once cache temizler.',
    'Bug bulmak dedektifliktir, kapatmak ise sanattir.',
    'Sunucu cok sessizse iki ihtimal var: ya cok stabil ya da coktan patladi.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('espri')
        .setDescription('Rastgele bir espri atar'),

    async execute(client, interaction) {
        const joke = JOKES[Math.floor(Math.random() * JOKES.length)];

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Gunun Esprisi')
            .setDescription(joke)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
