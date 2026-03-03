const { EmbedBuilder, Colors } = require('@jubbio/core');

const HELP_CATEGORIES = {
    sistem: {
        title: 'Sistem Komutlari',
        color: Colors.Blurple,
        description: [
            '`/yardim` - Kategori bazli yardim menusu',
            '`/modlog` - Modlog kanalini ayarla',
            '`/giris` - Giris kanalini/mesajini ayarla',
            '`/cikis` - Cikis kanalini/mesajini ayarla',
            '`/otorol` - Otorol ayari',
        ].join('\n'),
    },
    moderasyon: {
        title: 'Moderasyon Komutlari',
        color: Colors.Red,
        description: [
            '`/ban` - Kullaniciyi sunucudan yasaklar',
            '`/kick` - Kullaniciyi sunucudan atar',
            '`/timeout` - Sureli susturma uygular',
            '`/untimeout` - Susturmayi kaldirir',
            '`/sil` - Kanaldan toplu mesaj temizler',
        ].join('\n'),
    },
    ekonomi: {
        title: 'Ekonomi Komutlari',
        color: Colors.Gold,
        description: [
            '`/bakiye`, `/gunluk`, `/calis`, `/suc`',
            '`/market`, `/satinal`, `/envanter`, `/kullan`',
            '`/yatir`, `/cek`, `/odeme`, `/soygun`',
            '`/liderlik`, `/profil`',
        ].join('\n'),
    },
    eglence: {
        title: 'Eglence Komutlari',
        color: Colors.Aqua,
        description: [
            '`/zar` - Rastgele zar atar',
            '`/yazitura` - Yazi/tura atar',
            '`/fal` - 8ball tarzi cevap verir',
            '`/espri` - Rastgele espri yazar',
            '`/anket` - Butonlu mini anket acar',
        ].join('\n'),
    },
};

function buildHelpEmbed(categoryKey = 'sistem') {
    const category = HELP_CATEGORIES[categoryKey] || HELP_CATEGORIES.sistem;

    return new EmbedBuilder()
        .setColor(category.color)
        .setTitle(category.title)
        .setDescription(category.description)
        .setFooter({ text: 'Jubbio Bot Yardim Merkezi' })
        .setTimestamp();
}

module.exports = {
    HELP_CATEGORIES,
    buildHelpEmbed,
};
