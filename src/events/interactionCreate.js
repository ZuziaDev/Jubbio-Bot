const { EmbedBuilder, Colors } = require('@jubbio/core');
const { buildHelpEmbed } = require('../utils/help_center');
const { buildPollComponents, buildPollEmbed, votePoll } = require('../utils/polls');

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        try {
            if (interaction.isCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(client, interaction);
                return;
            }

            if (interaction.isAutocomplete()) {
                const command = client.commands.get(interaction.commandName);
                if (!command?.autocomplete) return;
                await command.autocomplete(client, interaction);
                return;
            }

            if (interaction.isSelectMenu()) {
                if (interaction.customId === 'help_category') {
                    const selected = interaction.values?.[0] || 'sistem';
                    await interaction.update({
                        embeds: [buildHelpEmbed(selected)],
                        components: interaction.message?.components || [],
                    });
                }
                return;
            }

            if (interaction.isButton()) {
                if (interaction.customId.startsWith('poll:')) {
                    const [, pollId, voteType] = interaction.customId.split(':');
                    const voteResult = votePoll(client, pollId, interaction.user.id, voteType);

                    if (!voteResult.ok) {
                        return interaction.reply({ content: voteResult.reason, ephemeral: true });
                    }

                    await interaction.update({
                        embeds: [buildPollEmbed(voteResult.poll)],
                        components: buildPollComponents(pollId),
                    });
                }
            }
        } catch (error) {
            console.error('[Interaction Error]', error);

            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Komut Hatasi')
                .setDescription('Islem sirasinda bir hata olustu. Lutfen tekrar dene.');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed] }).catch(() => {});
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
            }
        }
    },
};
