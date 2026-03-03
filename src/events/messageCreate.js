const { EmbedBuilder, Colors } = require('@jubbio/core');
const { prefix } = require('../config');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (!message || message.author?.bot) return;

        const content = String(message.content || '').trim();
        if (!content) return;

        const isMentioned =
            client.user?.id &&
            (content.includes(`<@${client.user.id}>`) || content.includes(`<@!${client.user.id}>`));

        const lower = content.toLowerCase();
        const isHelpKeyword = lower === `${prefix}yardim` || lower === `${prefix}help`;

        if (!isMentioned && !isHelpKeyword) return;

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('Jubbio Moderasyon + Ekonomi Botu')
            .setDescription(
                [
                    'Komutlar slash komut olarak calisir.',
                    '`/yardim` yazarak kategori secip tum komutlari gorebilirsin.',
                    '',
                    'Ornekler:',
                    '- `/modlog`',
                    '- `/giris`',
                    '- `/otorol`',
                    '- `/bakiye`',
                    '- `/market`',
                    '- `/ban`',
                ].join('\n')
            )
            .setFooter({ text: 'Bot yardimi' })
            .setTimestamp();

        await message.reply({ embeds: [embed] }).catch(() => {});
    },
};
