const { Firebase } = require('./utils/database.js');
const path = require('path');
const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');

const db = new Firebase(
    serviceAccountPath,
    "https://database.firebaseio.com",
    "jubbio"
);
module.exports = {
    prefix: '!',
    db,
}
