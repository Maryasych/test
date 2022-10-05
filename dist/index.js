import express from 'express';
import * as http from 'http';
import path from 'path';
import cors from 'cors';
import config from './config';
import geckos from '@geckos.io/server';
import { World } from './ts/world/World';
class Server {
    app = express();
    // private router = MasterRouter;
    constructor() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: false, limit: '50mb' }));
        this.app.use(cors());
        const serverHttp = http.createServer(this.app);
        const io = geckos();
        io.addServer(serverHttp);
        io.onConnection((channel) => {
            channel.onDisconnect(() => {
                console.log(`${channel.id} got disconnected`);
                world.disposeAll();
            });
            const world = new World(channel, path.resolve(process.cwd(), './src/assets/models/level1.glb'));
        });
        serverHttp.listen(config.PORT, () => {
            console.log('Launched SkyBuds server');
        });
    }
}
new Server();
