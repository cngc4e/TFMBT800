const { ByteArray } = require("transformice.js");

const M_TO_P = 10 / 3; // not confirmed
class ShamanObject {
    constructor(id, type, x = 0, y = 0, vx = 0, vy = 0,
        angle = 0, vangle = 0, param9 = false, isIdle = false, isGhost = false, colors = null) {
        this.id = id;
        this.type = type;
        this.isDeleted = this.var_2307 == -1;
        this.x = x / 100 * M_TO_P;
        this.y = y / 100 * M_TO_P;
        this.vx = vx / 100 * M_TO_P
        this.vy = vy / 100 * M_TO_P;
        this.angle = angle / 100 * M_TO_P;
        this.vangle = vangle / 100 * M_TO_P;
        this.unknown1 = param9;
        this.isIdle = isIdle;
        this.isGhost = isGhost;
        /** @type {number[]} */
        this.colors = colors;
    }

    /**
     * Sync object
     * @param {ByteArray} packet
     * @return {ShamanObject[]}
     */
    static fromPacket4_3(packet) {
        var _loc2_ = null;
        var _loc3_ = 0;
        var _loc4_ = 0;
        var ret = [];
        while (packet.bytesAvailable > 0) {
            _loc3_ = packet.readInt();
            _loc4_ = packet.readShort();
            if (_loc4_ == -1) {
                _loc2_ = new ShamanObject(_loc3_, -1);
            } else {
                _loc2_ = new ShamanObject(
                    _loc3_, _loc4_,
                    packet.readShort(), packet.readShort(),
                    packet.readShort(), packet.readShort(),
                    packet.readShort(), packet.readShort(),
                    packet.readBoolean(), packet.readBoolean(),
                    packet.readByte() == 1);
            }
            ret.push(_loc2_);
        }
        return ret;
    }

    /**
     * Spawn object
     * @param {ByteArray} packet
     * @return {ShamanObject}
     */
    fromPacket5_20(packet) {
        /*this.var_1409 = packet.readInt();
        this.var_1502 = packet.readShort();
        this.var_3722 = packet.readShort();
        this.var_3723 = packet.readShort();
        this.var_0691 = packet.readShort();
        this.var_3724 = packet.readByte();
        this.var_3725 = packet.readByte();
        this.var_3071 = packet.readByte() == 1;*/
        return new ShamanObject(
            packet.readInt(), packet.readShort(),
            packet.readShort(), packet.readShort(),
            packet.readShort(), packet.readShort(),
            packet.readShort(), packet.readShort(),
            packet.readBoolean(), packet.readBoolean(),
            packet.readByte() == 1);
        /*var _loc2_: int = packet.readByte();
        this.var_0745 = new Array();
        var _loc3_: int = 0;
        while (_loc3_ < _loc2_) {
            this.var_0745.push(packet.readInt());
            _loc3_++;
        }*/
    }
}

module.exports = {
    ShamanObject: ShamanObject
}
