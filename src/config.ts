import * as dotenv from 'dotenv';

dotenv.config({
  path: '../.env'
});

export default {
  PORT: process.env.PORT || '3001'
} as {
  PORT: string;
};
