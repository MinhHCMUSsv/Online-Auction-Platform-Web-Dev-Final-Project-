import random from 'random';

export const generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
}