const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatMoney, parseAmountInput } = require('../utils/command_utils');
const { getAccount, saveAccount } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('odeme')
        .setDescription('Bir kullaniciya para gonderirsin')
        .addUserOption((option) =>
            option
                .setName('kullanici')
                .setDescription('Para gonderilecek uye')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('miktar')
                .setDescription('Gonderilecek miktar (ornek: 500)')
                .setRequired(true)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const targetUserId = interaction.options.getUser('kullanici', true);
        const amountText = interaction.options.getString('miktar', true);

        if (String(targetUserId) === String(interaction.user.id)) {
            return interaction.reply({ content: 'Kendine odeme gonderemezsin.', ephemeral: true });
        }

        const sender = await getAccount(interaction.guildId, interaction.user.id, { user: interaction.user });
        const receiver = await getAccount(interaction.guildId, targetUserId, { user: { username: `Kullanici ${targetUserId}` } });

        const amount = parseAmountInput(amountText, sender.wallet);
        if (!amount || amount <= 0) {
            return interaction.reply({ content: 'Gecerli bir miktar yazmalisin.', ephemeral: true });
        }

        if (sender.wallet < amount) {
            return interaction.reply({ content: 'Cuzdaninda bu kadar para yok.', ephemeral: true });
        }

        const tax = Math.floor(amount * 0.03);
        const net = amount - tax;

        sender.wallet -= amount;
        receiver.wallet += net;

        await saveAccount(interaction.guildId, interaction.user.id, sender);
        await saveAccount(interaction.guildId, targetUserId, receiver);

        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('Odeme Gerceklesti')
            .setDescription(`<@${targetUserId}> kullanicisina para gonderdin.`)
            .addFields(
                { name: 'Gonderilen', value: formatMoney(amount), inline: true },
                { name: 'Transfer Vergisi', value: formatMoney(tax), inline: true },
                { name: 'Aliciya Giden', value: formatMoney(net), inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
