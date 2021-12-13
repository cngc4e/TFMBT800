import { Base, Client } from "@cheeseformice/transformice.js";
import { ExtClient } from "./client";

export class ServerMessage extends Base {
    /**
     * Whether the message appears in the #Server channel.
     */
    inChannel: boolean;
    content: string;
    /**
     * A list of strings used as replacement inside the message content.
     */
    args: string[];

    constructor(
        client: ExtClient,
        inChannel: boolean,
        content: string,
        args: string[]
    ) {
        super(client);
        this.inChannel = inChannel;
        this.content = content;
        this.args = args;
    }
}

// ??
export enum LongTextPopupContent {
    LSMAP = 0,
    LUAHELP = 1,
    LUACODE = 2
}

export class LongTextPopup extends Base {
    contentType: LongTextPopupContent;
    content: string;
    /**
     * Used to uniquely identify this popup type in some cases.
     * It is not known when this is set as all known cases have this as `null`.
     * @deprecated Not recommended to use until more is found about this.
     */
    key?: string;

    constructor(
        client: Client,
        contentType: LongTextPopupContent,
        content: string,
        key?: string
    ) {
        super(client);
        this.contentType = contentType;
        this.content = content;
        this.key = key;
    }
}
