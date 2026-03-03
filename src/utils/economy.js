const { db } = require('../config');

const DAY_MS = 24 * 60 * 60 * 1000;

const COOLDOWNS = {
    daily: DAY_MS,
    work: 45 * 60 * 1000,
    crime: 60 * 60 * 1000,
    rob: 2 * 60 * 60 * 1000,
};

const SHOP_ITEMS = {
    lockpick: {
        id: 'lockpick',
        name: 'Lockpick',
        price: 2200,
        description: 'Soygun denemesi icin gerekli arac.',
        type: 'tool',
    },
    shield: {
        id: 'shield',
        name: 'Shield',
        price: 2600,
        description: 'Bir soygun girisimini otomatik engeller.',
        type: 'consumable',
    },
    lucky_charm: {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        price: 3900,
        description: '24 saat boyunca kazanca %20 bonus verir.',
        type: 'consumable',
    },
    vault_upgrade: {
        id: 'vault_upgrade',
        name: 'Vault Upgrade',
        price: 6500,
        description: 'Banka kapasitesini kalici olarak arttirir.',
        type: 'upgrade',
    },
};

const DEFAULT_ACCOUNT = {
    wallet: 500,
    bank: 0,
    xp: 0,
    level: 1,
    vaultLevel: 0,
    inventory: {},
    cooldowns: {
        daily: 0,
        work: 0,
        crime: 0,
        rob: 0,
    },
    streaks: {
        daily: 0,
        lastDailyAt: 0,
    },
    boosts: {
        luckyUntil: 0,
    },
    stats: {
        earned: 0,
        spent: 0,
        won: 0,
        lost: 0,
        robbed: 0,
        robbedBy: 0,
    },
    profile: {
        username: 'Bilinmiyor',
    },
    lastInterestAt: Date.now(),
    updatedAt: Date.now(),
};

function toFiniteNumber(value, fallback = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return num;
}

function clampNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    return Math.min(max, Math.max(min, value));
}

function getAccountPath(guildId, userId) {
    return `guilds/${guildId}/economy/users/${userId}`;
}

function calculateLevel(xp) {
    const safeXp = Math.max(0, Math.floor(xp));
    return Math.max(1, Math.floor(Math.sqrt(safeXp / 120)) + 1);
}

function normalizeInventory(rawInventory) {
    const inventory = {};
    if (!rawInventory || typeof rawInventory !== 'object') return inventory;

    for (const [itemId, amount] of Object.entries(rawInventory)) {
        const qty = Math.max(0, Math.floor(toFiniteNumber(amount, 0)));
        if (qty > 0) inventory[itemId] = qty;
    }

    return inventory;
}

function normalizeAccount(rawData) {
    const merged = {
        ...DEFAULT_ACCOUNT,
        ...(rawData || {}),
        cooldowns: {
            ...DEFAULT_ACCOUNT.cooldowns,
            ...((rawData && rawData.cooldowns) || {}),
        },
        streaks: {
            ...DEFAULT_ACCOUNT.streaks,
            ...((rawData && rawData.streaks) || {}),
        },
        boosts: {
            ...DEFAULT_ACCOUNT.boosts,
            ...((rawData && rawData.boosts) || {}),
        },
        stats: {
            ...DEFAULT_ACCOUNT.stats,
            ...((rawData && rawData.stats) || {}),
        },
        profile: {
            ...DEFAULT_ACCOUNT.profile,
            ...((rawData && rawData.profile) || {}),
        },
        inventory: normalizeInventory(rawData?.inventory),
    };

    merged.wallet = clampNumber(Math.floor(toFiniteNumber(merged.wallet, 500)));
    merged.bank = clampNumber(Math.floor(toFiniteNumber(merged.bank, 0)));
    merged.xp = clampNumber(Math.floor(toFiniteNumber(merged.xp, 0)));
    merged.level = calculateLevel(merged.xp);
    merged.vaultLevel = clampNumber(Math.floor(toFiniteNumber(merged.vaultLevel, 0)), 0, 1000);

    merged.cooldowns.daily = Math.floor(toFiniteNumber(merged.cooldowns.daily, 0));
    merged.cooldowns.work = Math.floor(toFiniteNumber(merged.cooldowns.work, 0));
    merged.cooldowns.crime = Math.floor(toFiniteNumber(merged.cooldowns.crime, 0));
    merged.cooldowns.rob = Math.floor(toFiniteNumber(merged.cooldowns.rob, 0));

    merged.streaks.daily = clampNumber(Math.floor(toFiniteNumber(merged.streaks.daily, 0)), 0, 9999);
    merged.streaks.lastDailyAt = Math.floor(toFiniteNumber(merged.streaks.lastDailyAt, 0));

    merged.boosts.luckyUntil = Math.floor(toFiniteNumber(merged.boosts.luckyUntil, 0));

    merged.stats.earned = clampNumber(Math.floor(toFiniteNumber(merged.stats.earned, 0)));
    merged.stats.spent = clampNumber(Math.floor(toFiniteNumber(merged.stats.spent, 0)));
    merged.stats.won = clampNumber(Math.floor(toFiniteNumber(merged.stats.won, 0)));
    merged.stats.lost = clampNumber(Math.floor(toFiniteNumber(merged.stats.lost, 0)));
    merged.stats.robbed = clampNumber(Math.floor(toFiniteNumber(merged.stats.robbed, 0)));
    merged.stats.robbedBy = clampNumber(Math.floor(toFiniteNumber(merged.stats.robbedBy, 0)));

    merged.lastInterestAt = Math.floor(toFiniteNumber(merged.lastInterestAt, Date.now()));
    merged.updatedAt = Math.floor(toFiniteNumber(merged.updatedAt, Date.now()));

    return merged;
}

function getBankCapacity(account) {
    return 20000 + account.vaultLevel * 6000;
}

function isLuckyBoostActive(account) {
    return Date.now() < account.boosts.luckyUntil;
}

function applyLuckBoost(account, amount) {
    const base = Math.max(0, Math.floor(amount));
    if (!isLuckyBoostActive(account)) return base;
    return Math.floor(base * 1.2);
}

function getCooldownLeft(account, key, cooldownMs) {
    const lastUsedAt = Math.floor(account.cooldowns?.[key] || 0);
    const left = lastUsedAt + cooldownMs - Date.now();
    return Math.max(0, left);
}

function setCooldown(account, key) {
    account.cooldowns[key] = Date.now();
}

function grantXp(account, economyAmount) {
    const gain = clampNumber(Math.floor(Math.max(5, economyAmount / 20)), 5, 150);
    const oldLevel = account.level;

    account.xp += gain;
    account.level = calculateLevel(account.xp);

    return {
        xpGain: gain,
        leveledUp: account.level > oldLevel,
        previousLevel: oldLevel,
        currentLevel: account.level,
    };
}

function syncProfile(account, user) {
    if (!user) return;
    account.profile = account.profile || {};
    account.profile.username = user.username || account.profile.username || 'Bilinmiyor';
}

function applyBankInterest(account) {
    const now = Date.now();
    const elapsed = now - account.lastInterestAt;

    if (elapsed < DAY_MS) return 0;

    const days = Math.floor(elapsed / DAY_MS);
    const interestPerDay = Math.floor(account.bank * 0.0035);
    const totalInterest = clampNumber(Math.min(interestPerDay * days, 5000 * days), 0);

    if (totalInterest > 0) {
        account.bank += totalInterest;
        account.stats.earned += totalInterest;
    }

    account.lastInterestAt += days * DAY_MS;
    return totalInterest;
}

async function saveAccount(guildId, userId, account) {
    account.updatedAt = Date.now();
    await db.set(getAccountPath(guildId, userId), account);
    return account;
}

async function getAccount(guildId, userId, options = {}) {
    const raw = await db.get(getAccountPath(guildId, userId));
    const account = normalizeAccount(raw);

    if (options.user) {
        syncProfile(account, options.user);
    }

    const interest = applyBankInterest(account);

    if (!raw || interest > 0 || options.user) {
        await saveAccount(guildId, userId, account);
    }

    return account;
}

function getNetWorth(account) {
    return account.wallet + account.bank;
}

function getItem(itemId) {
    return SHOP_ITEMS[itemId] || null;
}

function getShopItems() {
    return Object.values(SHOP_ITEMS);
}

function getInventoryAmount(account, itemId) {
    return Math.max(0, Math.floor(account.inventory?.[itemId] || 0));
}

function addInventory(account, itemId, amount) {
    const current = getInventoryAmount(account, itemId);
    const next = Math.max(0, current + Math.floor(amount));

    if (next <= 0) {
        delete account.inventory[itemId];
    } else {
        account.inventory[itemId] = next;
    }
}

function buyItem(account, itemId, quantity) {
    const item = getItem(itemId);
    if (!item) {
        return { ok: false, reason: 'Bu urun markette yok.' };
    }

    const count = clampNumber(Math.floor(toFiniteNumber(quantity, 1)), 1, 50);
    const totalCost = item.price * count;

    if (account.wallet < totalCost) {
        return {
            ok: false,
            reason: `Yetersiz bakiye. Gerekli: ${totalCost}, mevcut: ${account.wallet}`,
        };
    }

    account.wallet -= totalCost;
    account.stats.spent += totalCost;

    if (item.type === 'upgrade') {
        account.vaultLevel += count;
    } else {
        addInventory(account, item.id, count);
    }

    const xpInfo = grantXp(account, totalCost);

    return {
        ok: true,
        item,
        quantity: count,
        totalCost,
        xpInfo,
    };
}

function useItem(account, itemId) {
    const item = getItem(itemId);
    if (!item) return { ok: false, reason: 'Bu urun bulunamadi.' };

    const qty = getInventoryAmount(account, itemId);
    if (qty <= 0) return { ok: false, reason: 'Envanterinde bu urun yok.' };

    if (itemId === 'lucky_charm') {
        addInventory(account, itemId, -1);
        const base = Math.max(Date.now(), account.boosts.luckyUntil || 0);
        account.boosts.luckyUntil = base + DAY_MS;
        return {
            ok: true,
            message: 'Lucky Charm aktif edildi. 24 saat boyunca %20 bonus acik.',
        };
    }

    return {
        ok: false,
        reason: 'Bu urun aktif kullanilamiyor.',
    };
}

function consumeShieldIfAny(account) {
    const hasShield = getInventoryAmount(account, 'shield') > 0;
    if (!hasShield) return false;

    addInventory(account, 'shield', -1);
    return true;
}

function hasLockpick(account) {
    return getInventoryAmount(account, 'lockpick') > 0;
}

function getInventoryLines(account) {
    const lines = [];

    for (const [itemId, qty] of Object.entries(account.inventory)) {
        const item = getItem(itemId);
        if (!item || qty <= 0) continue;
        lines.push(`${item.name} x${qty}`);
    }

    if (lines.length === 0) return ['Envanter bos.'];
    return lines;
}

async function getLeaderboard(guildId, limit = 10) {
    const raw = (await db.get(`guilds/${guildId}/economy/users`)) || {};

    const mapped = Object.entries(raw).map(([userId, data]) => {
        const account = normalizeAccount(data);
        return {
            userId,
            username: account.profile?.username || `Kullanici ${userId}`,
            wallet: account.wallet,
            bank: account.bank,
            netWorth: getNetWorth(account),
            level: account.level,
        };
    });

    mapped.sort((a, b) => b.netWorth - a.netWorth);
    return mapped.slice(0, limit);
}

module.exports = {
    COOLDOWNS,
    DAY_MS,
    DEFAULT_ACCOUNT,
    SHOP_ITEMS,
    addInventory,
    applyLuckBoost,
    buyItem,
    consumeShieldIfAny,
    getAccount,
    getBankCapacity,
    getCooldownLeft,
    getInventoryAmount,
    getInventoryLines,
    getItem,
    getLeaderboard,
    getNetWorth,
    getShopItems,
    grantXp,
    hasLockpick,
    isLuckyBoostActive,
    parseAmountInput: (value, max) => {
        const text = String(value || '').trim().toLowerCase();
        if (!text) return null;
        if (['all', 'hepsi', 'max', 'tum', 'tamami'].includes(text)) {
            return Math.max(0, Math.floor(max || 0));
        }
        const numeric = Number(text.replace(/[, ]/g, ''));
        if (!Number.isFinite(numeric) || numeric <= 0) return null;
        return Math.floor(numeric);
    },
    saveAccount,
    setCooldown,
    syncProfile,
    useItem,
};
