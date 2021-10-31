"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transformice_js_1 = require("transformice.js");
var client = new transformice_js_1.Client("Buildtool#0800", "qwerty123", {
    language: transformice_js_1.enums.languages.en,
    loginRoom: "*#cbase bot bt"
});
client.on("roomMessage", function (message) {
    if (client.name === message.author.name)
        return;
    client.sendRoomMessage(message.author.name);
});
client.on("ready", function () {
    console.log("ready!");
});
client.on("loginError", function (code, err1, err2) {
    console.error("Login err", code, err1, err2);
});
client.on("connectionError", function () {
    console.error("Connection err");
});
client.run();
