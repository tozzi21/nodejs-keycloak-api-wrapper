const RealmAPI = require("../index.js").RealmAPI;

let api = new RealmAPI({
    isHttps: false,
    hostname: "localhost",
    port: "8080",
    clientId: "test",
    clientSecret: "UXPmLnZkj5RVE4vPwOlNrzSe9ZX4ty4F",
    realm: 'Test'
});

const sleep = time => new Promise(res => setTimeout(res, time, "done sleeping"));

let accessToken = "";
let userId = "";
let choosenUsername = "";

api.renewAccessToken().then(function (resp) {
    console.log("access token resp", resp);
    accessToken = resp.access_token;
    choosenUsername = prompt("Please choose a unique username:");

    return api.registerNewUser({
        "username": choosenUsername,
        "attributes": {
            "a": ["b"],
            "e": ['f'],
            "k": ["l"]
        },
        "enabled": true,
        "firstName": "firstName",
        "lastName": "lastName",
        "email": choosenUsername + "email@email.com"
    }, accessToken).then(function (resp) {
        console.log("register new user resp", resp);
        return api.lookUpUsername(choosenUsername, accessToken);
    }).then(function (resp) {
        console.log("look up user resp", resp);
        return resp.id;
    }).then(function (id) {
        userId = id;
        console.log('updating user');
        console.log(id);
        return api.updateUser(id, {'a': ['1'], 'c': ['2']}, accessToken)
    }).then(function (resp) {
        console.log("update user resp", resp);
        console.log('updated user getting new');
        return sleep(2000).then(function () {
            console.log("user id is", userId, accessToken);
            return api.getUser(userId, accessToken);
        });
    }).then(function (resp) {
        console.log('updated user (get user)', resp);
    }).then(function (resp) {
        return api.resetPassword(userId, "me", accessToken);
    }).then(function (resp) {
        console.log("password reset ", resp);
        return api.logInUser(choosenUsername, "me");
    }).then(function (resp) {
        console.log("login response", resp);
        return resp;
    }).then(function (resp) {
        return api.renewUserAccessToken(resp.refresh_token);
    }).then(function (resp) {
        console.log("refresh response", resp);
        return api.generateTOTPDetails(userId, accessToken);
    }).then(function (resp) {
        console.log('totp details:', resp);
        return resp;
    }).then(function (resp) {
        const initialCode = prompt('Enter the initial code: ');
        return api.submitTOTPDetails(userId, "test", resp.encodedTotpSecret, initialCode, false, accessToken);
    }).then(function (resp) {
        console.log(resp);
    }).then(function (resp) {
        const code = prompt('Enter current code');
        return api.verifyTotpCode(userId, code,"test", accessToken)
    }).then(function (resp) {
        console.log('Verification code resp', resp);
    }).catch(function (err) {
        console.log(err);
    })

    /**
     api.lookUpUsername("meme18", accessToken).then(function (out) {
        console.log(out);
    }).then(function () {

    })
     **/
}).catch(function (err) {
    console.log(err);
});

