var MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const config = require('./config.json');
var _db;

module.exports = {
    connectToServer: function (callback) {
        MongoClient.connect(config.DATABASE.URL, function (err, db) {
            assert.equal(null, err);
            console.log("Connected");
            _db = db;
            return callback(err);
        });
    },
    getDb: function () {
        return _db;
    }
};