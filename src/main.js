const { IdentifierSplit } = require("transformice.js");
const { Client, Identifier, enums } = require("transformice.js");
const { ShamanObject } = require("./packetIn/ShamanObject");

const zlib = require("zlib");

const client = new Client(process.env.TFM_USER, process.env.TFM_PASS, {
	language: enums.languages.en,
    loginRoom: "*#cbase bot bt",
    autoReconnect: false
});

client.on("roomMessage", (message) => {
	if (client.name === message.author.name) return;
    if (message.content.match("allplank"))
	    client.sendRoomMessage("retard");
    if (message.content.match("cat"))
	    client.sendRoomMessage("woof");
    if (message.content.match("meow"))
	    client.sendRoomMessage("moo");
    if (message.content.match("rini"))
	    client.sendRoomMessage("scary as always");
    if (message.content.match(/\b(bt|buildtool)/mi))
	    client.sendRoomMessage("bt rocks!");
    if (message.content.match("boss"))
	    client.sendRoomMessage("boss lynn durand sp beside jiren camp");
});

client.on("ready", () => {
    console.log("ready!");
    /*client.enterRoom("*#cbase bt", {
        password: "1020"
    });*/
});

var af = false;
client.on("rawPacket", (conn, ccc, packet) => {
    packet.readPosition = 2;
    switch (ccc) {
        case Identifier(4, 3): {
            //let objs = ShamanObject.fromPacket4_3(packet);
            //console.dir(objs);
            break;
        }
        case Identifier(5, 2): {
            let map_code = packet.readInt();
            let num_players = packet.readShort();
            let round_code = packet.readByte();
            let enclen = packet.readInt();

            console.log("map_code", map_code);
            console.log("# of players", num_players);
            console.log("round number", round_code);

            if (enclen > 0) {
                let encxml = packet.readBufBytes(enclen);
                console.log("length encxml:", encxml.length);
                console.log(zlib.inflateSync(encxml).toString());
            }

            console.log("author", packet.readUTF());
            console.log("perm", packet.readByte());
            //console.log("? bool", packet.readBool());
            break;
        }
    }
    //console.log("receive",IdentifierSplit(ccc))
    //console.log(packet.toString())
});

client.on("roomMessage", (message) => {
    console.log(`[${message.author.name}] ${message.content}`);
});

client.on("roomChange", (newRoom) => {
    //if (newRoom.name == "*#cbase bot bt") {
        //client.sendRoomMessage("!pw abc");
        client.sendRoomMessage("hi ! 😀");
    //}
});

client.on("connect", (conn) => {
    console.log("establish conn", conn.socket.remoteAddress, conn.socket.remotePort);
});

client.on("restart", () => {
    console.log("restarting!");
    console.trace();
});

client.on("loginError", (code, err1, err2) => {
    // code
    // 1: already connected
    // 2: incorrect
    console.error("Login err", code, err1, err2);
});

client.on("connectionError", (err) => {
    console.error("Connection err", err);
});

process.on("uncaughtException", (err) => {
    console.error('UNCAUGHT EXCEPTION -', err);
});

client.run();
