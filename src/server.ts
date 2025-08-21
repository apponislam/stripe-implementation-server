import { Server } from "http";
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import http from "http";

async function main() {
    try {
        await mongoose.connect(config.mongodb_url as string);
        const server: Server = http.createServer(app);
        server.listen(config.port, () => {
            console.log(`App listening on port ${config.port}`);
        });
    } catch (err) {
        console.log(err);
    }
}

main();
