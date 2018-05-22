'use strict';

const Path = require('path');
const LogGenerator = require('../utils/log-generator');

const chillScript = [
    { amount: 1000, duration: 120000 },
    { amount: 1000, duration: 120000 },
    { amount: 1000, duration: 120000 },
    { amount: 1000, duration: 120000 }
];

const spazzyScript = [
    { amount: 160, duration: 15000 },
    { amount: 100, duration: 15000 },
    { amount: 160, duration: 15000 },
    { amount: 100, duration: 15000 },
    { amount: 160, duration: 15000 },
    { amount: 100, duration: 15000 }
];

LogGenerator.start({
    script: spazzyScript,
    file: Path.resolve(__dirname, '../test/test-access.log')
});
