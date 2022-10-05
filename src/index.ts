import express from 'express';
import * as THREE from 'three';
import * as http from 'http';
import path from 'path';
import cors from 'cors';
import config from './config';
import geckos, { ServerChannel } from '@geckos.io/server';
import { World } from './ts/world/World';
import { Character } from './ts/characters/Character';
import { channel } from 'diagnostics_channel';

class Server {
  private app = express();
  // private router = MasterRouter;

  constructor() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    this.app.use(cors());

    const serverHttp = http.createServer(this.app);

    const io = geckos();
    io.addServer(serverHttp);

    io.onConnection((channel: ServerChannel) => {
      channel.onDisconnect(() => {
        console.log(`${channel.id} got disconnected`);
        world.disposeAll();
      });

      const world = new World(
        channel,
        path.resolve(process.cwd(), './src/assets/models/level1.glb')
      );
    });


    serverHttp.listen(config.APP_PORT, () => {
      console.log('Launched SkyBuds server');
    });
  }
}

new Server();
