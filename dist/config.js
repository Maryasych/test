import * as dotenv from 'dotenv';
dotenv.config({
    path: '../.env'
});
export default {
    PORT: process.env.PORT || '80'
};