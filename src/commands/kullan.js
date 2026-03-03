const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { getAccount, saveAccount, useItem } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullan')
        .setDescription('Envanterindeki bir urunu kullanir')
        .addStringOption((option) =>
            option
                .setName('urun')
                .setDescription('Kullanilacak urun')
                .setRequired(true)
                .addChoices({ name: 'Lucky Charm', value: 'lucky_charm' })
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const itemId = interaction.options.getString('urun', true);
        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const result = useItem(account, itemId);
        if (!result.ok) {
            return interaction.reply({ content: result.reason, ephemeral: true });
        }

        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Urun Kullanildi')
            .setDescription(result.message)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
