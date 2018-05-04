const Clarifai = require('clarifai');
const config = require('./config');
const fs = require('fs');
const database = require('./database');
const matching = require('./matching');

const clarifai = new Clarifai.App({
   apiKey: config.API.CLARIFAI_API_KEY
});


function getFiles(dir){
    let directories = fs.readdirSync(dir);
    directories.forEach(function(directory){
       getMetrics(__dirname + '/people/' + directory);
    });
}

function getMetrics(dir) {
    let users_json = dir + "/users.json";
    let user = {
        first_name: "",
        last_name: "",
        tags: "",
        tags_math:"",
        age: "",
        age_math:"",
        gender:"",
        gender_math:"",
        culture: "",
        culture_math: ""
    };

    let files = fs.readdirSync(dir);
    files.forEach(function(file){
        if(!file.includes("users")){
            let base64str = base64_encode(dir + '/' + file);
            let demoPromise = setDemographics(dir, base64str);
            let generalPromise = setGeneralTags(dir, base64str);

            Promise.all([demoPromise, generalPromise]).then(values => {
                let currentUser = JSON.parse(fs.readFileSync(users_json, 'utf8'));
                let tags;
                if(typeof currentUser.tags !== 'undefined' && currentUser.tags ){
                    tags = currentUser.tags.concat(values[1].tags);
                }else{
                    tags = values[1].tags;
                }

                user.first_name = currentUser.first_name;
                user.last_name = currentUser.last_name;
                user.tags = tags;
                user.tags_math = values[1].tags_math;
                user.age = values[0].age;
                user.age_math=values[0].age_math;
                user.gender=values[0].gender;
                user.gender_math=values[0].gender_math;
                user.culture=values[0].culture;
                user.culture_math=values[0].culture_math;

                let toWrite = JSON.stringify(user);
                fs.writeFile(users_json, toWrite, function (err) {
                    if (err) throw err;
                });

            }, reason => {
                console.log(reason)
            });
        }
    });
}

function setGeneralTags(dir, base64str){
    return new Promise (function(resolve, reject){
        clarifai.models.predict(Clarifai.GENERAL_MODEL, base64str ).then(
            function(response) {
                let returnObject = {
                    tags: "",
                    tags_math:""
                };
                let data = response.outputs[0].data;
                let size = Object.keys(data).length;
                let tags = [];
                if(size > 0){
                    let conceptData = data.concepts;
                    conceptData.forEach(function(concept){
                       tags.push(concept.name);
                    });
                    returnObject.tags = tags;
                    returnObject.tags_math = conceptData;
                    resolve(returnObject);
                }
            },
            function(err) {
                reject(err);
            }
        );
    });
}

function setDemographics(dir, base64str){
    return new Promise (function(resolve, reject){
        clarifai.models.predict(Clarifai.DEMOGRAPHICS_MODEL, base64str ).then(
            function(response) {
                let returnObject = {
                    age: "",
                    age_math:"",
                    gender:"",
                    gender_math:"",
                    culture: "",
                    culture_math: ""
                };
                let data = response.outputs[0].data;
                let size = Object.keys(data).length;
                if(size > 0){
                    let faceData = data.regions[0].data.face;
                    let age_appearance = faceData.age_appearance.concepts;
                    let ageObject = {
                        age:"",
                        value:""
                    };
                    if(age_appearance[0].value > 0.60){
                        ageObject.age = age_appearance[0].name;
                        ageObject.value = age_appearance[0].value;
                        returnObject.age = ageObject;
                        returnObject.age_math = age_appearance[0];
                    }else{
                        let ageSize = Object.keys(age_appearance).length;
                        let age_total = 0;
                        let ageMathArray = [];
                        for(let i =0; i < ageSize / 2; i++){
                            age_total = Number(age_appearance[i].name) + age_total;
                            ageMathArray.push(age_appearance[i]);
                        }
                        returnObject.age = Math.floor(age_total/(ageSize/2));
                        returnObject.age_math = ageMathArray;
                    }

                    let gender_appearance = faceData.gender_appearance.concepts;
                    let genderObject = {
                        gender:"",
                        value:""
                    };
                    if(gender_appearance[0].name === 'masculine'){
                        genderObject.gender = 'male';
                        genderObject.value = gender_appearance[0].value;
                    }else{
                        genderObject.gender = 'female';
                        genderObject.value = gender_appearance[0].value;
                    }

                    let genderArray = [];
                    genderArray.push(gender_appearance[0]);
                    genderArray.push(gender_appearance[1]);

                    returnObject.gender = genderObject;
                    returnObject.gender_math = genderArray;

                    let multicultural_appearance = faceData.multicultural_appearance.concepts;
                    let cultureObject = {
                        culture:"",
                        value:""
                    };

                    cultureObject.culture = multicultural_appearance[0].name;
                    cultureObject.value = multicultural_appearance[0].value;

                    returnObject.culture = cultureObject;
                    returnObject.culture_math = multicultural_appearance;
                    resolve(returnObject);
                }
            },
            function(err) {
                reject(err);
            }
        );
    });
}

function base64_encode(file) {
    // read binary data
    let bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

function main(GET_FILES){
    if(GET_FILES){
       getFiles("./people");
        database.pushUserToDB('./people')
    }

    matching.matchEveryUser();
}
main(true);
