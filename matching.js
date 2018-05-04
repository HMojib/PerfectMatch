"use strict";
const config = require('./config.json');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

var numUsers;
var count = 0;
module.exports = {
    matchEveryUser: function(){
        let url = config.DATABASE.URL;
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected correctly to server");
            const userCol = db.collection(config.DATABASE.USERS);
            let usersPromise = getUsers(userCol);
            usersPromise.then(function(result){
                let users = result;
                numUsers = users.length;
                users.forEach(function(user){
                    let matches = getMatches(user, users);
                    let matchesPromise = updateUserWithMatches(matches, user, userCol);
                    matchesPromise.then(function(result){
                        count++;
                        if(count === numUsers){
                            db.close();
                        }
                    }, function(err){
                        console.log(err);
                    });
                });
            }, function(err){
                console.log(err);
            });
        });
    }
};

function getMatches(user, users){
    let returnArray = [];
    users.forEach(function(matches){
        let matchObject = {
          first_name:"",
          last_name:"",
          sim_tags:""
        };
        console.log(matches.gender.gender);
        console.log("user:" + user.gender.gender);
        if(matches.first_name !== user.first_name && matches.last_name !== user.last_name && matches.tags && matches.gender.gender !== user.gender.gender){
            let simTags = getSimTags(matches.tags, user.tags);
            if(simTags.length > 0){
                matchObject.first_name = matches.first_name;
                matchObject.last_name = matches.last_name;
                matchObject.sim_tags = simTags;
                returnArray.push(matchObject);
            }
        }
    });

    return returnArray;
}

function getSimTags(a, b) {
    let sorted_a = a.concat().sort();
    let sorted_b = b.concat().sort();
    let common = [];
    let a_i = 0;
    let b_i = 0;

    while (a_i < a.length
    && b_i < b.length)
    {
        if (sorted_a[a_i] === sorted_b[b_i]) {
            common.push(sorted_a[a_i]);
            a_i++;
            b_i++;
        }
        else if(sorted_a[a_i] < sorted_b[b_i]) {
            a_i++;
        }
        else {
            b_i++;
        }
    }
    return common;
}

function getUsers(userCol){
    return new Promise(function(resolve, reject){
        userCol.find({ "tags": { $exists: true, $ne: null } }).toArray(function(err, docs){
            if(err){
                reject(err);
            }else {
               resolve(docs);
            }
        });
    });
}

function updateUserWithMatches(matches, user, userCol){
    return new Promise(function(resolve, reject){
        userCol.updateOne({"first_name": user.first_name, "last_name": user.last_name}, {$set: {"matches": matches}}, function(err, result){
            if(err){
                reject(err);
            }else {
                resolve(result);
            }
        });
    });
}
