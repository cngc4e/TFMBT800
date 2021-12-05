import { Base } from "@cheeseformice/transformice.js";
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
