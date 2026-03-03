const { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('@jubbio/core');

function ensurePollStore(client) {
    if (!client.pollStore) {
        client.pollStore = new Map();
    }
    return client.pollStore;
}

function createPoll(client, pollId, question, authorId) {
    const store = ensurePollStore(client);
    store.set(pollId, {
        id: pollId,
        question,
        authorId,
        votes: {
            yes: new Set(),
            no: new Set(),
        },
        createdAt: Date.now(),
    });
}

function getPoll(client, pollId) {
    const store = ensurePollStore(client);
    return store.get(pollId) || null;
}

function votePoll(client, pollId, userId, voteType) {
    const poll = getPoll(client, pollId);
    if (!poll) {
        return { ok: false, reason: 'Anket bulunamadi veya suresi doldu.' };
    }

    if (!['yes', 'no'].includes(voteType)) {
        return { ok: false, reason: 'Gecersiz oy tipi.' };
    }

    poll.votes.yes.delete(userId);
    poll.votes.no.delete(userId);
    poll.votes[voteType].add(userId);

    return {
        ok: true,
        poll,
    };
}

function buildPollEmbed(poll) {
    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle('Canli Anket')
        .setDescription(poll.question)
        .addFields(
            { name: 'Evet', value: String(poll.votes.yes.size), inline: true },
            { name: 'Hayir', value: String(poll.votes.no.size), inline: true },
            { name: 'Toplam Oy', value: String(poll.votes.yes.size + poll.votes.no.size), inline: true }
        )
        .setFooter({ text: `Anket ID: ${poll.id}` })
        .setTimestamp();
}

function buildPollComponents(pollId) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`poll:${pollId}:yes`)
                .setStyle(ButtonStyle.Success)
                .setLabel('Evet'),
            new ButtonBuilder()
                .setCustomId(`poll:${pollId}:no`)
                .setStyle(ButtonStyle.Danger)
                .setLabel('Hayir')
        ),
    ];
}

module.exports = {
    buildPollComponents,
    buildPollEmbed,
    createPoll,
    getPoll,
    votePoll,
};
