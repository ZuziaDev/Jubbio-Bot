const admin = require('firebase-admin');
const fs = require('fs');

class Firebase {
    constructor(serviceAccount, databaseURL, appName = Date.now().toString()) {
        // Çoklu Firebase app desteği (initializeApp clash fix)
        this.app = admin.initializeApp(
            {
                credential: admin.credential.cert(serviceAccount),
                databaseURL
            },
            appName
        );
        console.log(`${appName}  Database Activated!`);
        this.db = this.app.database();
    }

    // -------------------------
    //  Set & Push
    // -------------------------
    async set(path, value) {
        return this.db.ref(path).set(value);
    }

    async push(path, value) {
        return this.db.ref(path).push(value);
    }

    // -------------------------
    //  Get / Fetch
    // -------------------------
    async get(path) {
        const snapshot = await this.db.ref(path).once('value');
        return snapshot.val();
    }

    async fetch(path) {
        return this.get(path);
    }

    async fetchAll() {
        const snapshot = await this.db.ref('/').once('value');
        return snapshot.val();
    }

    async all() {
        return this.fetchAll();
    }

    // -------------------------
    //  Delete
    // -------------------------
    async remove(path) {
        return this.db.ref(path).remove();
    }

    async delete(path) {
        return this.remove(path);
    }

    async deleteKey(objectPath, key) {
        const data = await this.get(objectPath);
        if (!data || typeof data !== 'object') return;

        delete data[key];
        return this.set(objectPath, data);
    }

    // -------------------------
    //  Logical
    // -------------------------
    async has(path) {
        const snapshot = await this.db.ref(path).once('value');
        return snapshot.exists();
    }

    // -------------------------
    //  Query
    // -------------------------
    async findOne(path, childKey, value) {
        const snapshot = await this.db.ref(path)
            .orderByChild(childKey)
            .equalTo(value)
            .limitToFirst(1)
            .once('value');
        const data = snapshot.val();
        if (!data) return null;
        // data is an object with keys (ids), we just want the first value
        return Object.values(data)[0];
    }

    // -------------------------
    //  Math
    // -------------------------
    async add(path, value) {
        const currentValue = (await this.get(path)) || 0;
        return this.set(path, currentValue + value);
    }

    async subtract(path, value) {
        const currentValue = (await this.get(path)) || 0;
        return this.set(path, currentValue - value);
    }

    async math(path, operator, value) {
        let currentValue = (await this.get(path)) || 0;

        switch (operator) {
            case '+':
                currentValue += value;
                break;
            case '-':
                currentValue -= value;
                break;
            case '*':
                currentValue *= value;
                break;
            case '/':
                currentValue /= value;
                break;
            default:
                throw new Error('Invalid operator');
        }

        return this.set(path, currentValue);
    }

    // -------------------------
    //  Backup
    // -------------------------
    async setBackup(filePath) {
        const data = await this.fetchAll();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    async loadBackup(filePath) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        for (const key in data) {
            await this.set(key, data[key]);
        }
    }
}

module.exports = { Firebase };
