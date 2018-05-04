"use strict";
const config = require('./config.json');

const fs = require('fs');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

module.exports = {
    /*
    * Inserts given people into database with associated tags
     */
    pushUserToDB: function (dir) {
        let url = config.DATABASE.URL;
        // Use connect method to connect to the Server
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected correctly to server");

            const userCol = db.collection(config.DATABASE.USERS);
            let directories = fs.readdirSync(dir);
            let usersArray = [];

            directories.forEach(function(directory){
                let dir = __dirname + '/people/' + directory + '/users.json';
                usersArray.push(JSON.parse(fs.readFileSync(dir, 'utf8')));
            });

            userCol.insertMany(usersArray, function(err, result){
                if(err){
                    throw(err);
                }else{
                    assert.equal(usersArray.length, result.result.n);
                    assert.equal(usersArray.length, result.ops.length);
                    console.log("Insert complete");
                    db.close();
                }
            });

        });

    }
};
