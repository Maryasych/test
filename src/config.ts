import * as dotenv from 'dotenv';

dotenv.config({
  path: '../.env'
});

export default {
  APP_PORT: process.env.APP_PORT || '3001'
} as {
  APP_PORT: string;
};
