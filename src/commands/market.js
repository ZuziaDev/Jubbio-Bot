const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { getShopItems } = require('../utils/economy');
const { formatMoney } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Ekonomi market urunlerini listeler'),

    async execute(client, interaction) {
        const items = getShopItems();

        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle('Jubbio Market')
            .setDescription('Satin almak icin `/satinal urun:<id> adet:<sayi>` kullan.')
            .addFields(
                ...items.map((item) => ({
                    name: `${item.name} (${item.id})`,
                    value: `${item.description}\nFiyat: **${formatMoney(item.price)}**`,
                    inline: false,
                }))
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
