const { SlashCommandBuilder } = require('@jubbio/core');
const { buildPollComponents, buildPollEmbed, createPoll } = require('../utils/polls');

function createPollId() {
    const rand = Math.floor(Math.random() * 99999).toString(36);
    return `${Date.now().toString(36)}${rand}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anket')
        .setDescription('Butonlu canli bir anket baslatir')
        .addStringOption((option) =>
            option
                .setName('soru')
                .setDescription('Anket sorusu')
                .setRequired(true)
                .setMaxLength(220)
        ),

    async execute(client, interaction) {
        const question = interaction.options.getString('soru', true);
        const pollId = createPollId();

        createPoll(client, pollId, question, interaction.user.id);

        await interaction.reply({
            embeds: [buildPollEmbed({
                id: pollId,
                question,
                authorId: interaction.user.id,
                votes: { yes: new Set(), no: new Set() },
                createdAt: Date.now(),
            })],
            components: buildPollComponents(pollId),
        });
    },
};
