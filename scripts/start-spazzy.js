'use strict';

const Path = require('path');
const Spazzy = require('../lib/index');

console.log('Starting monitor');

Spazzy.monitor({
    file: Path.resolve(__dirname, '../test/test-access.log'),
    statsInterval: 1000,
    alertTriggerDuration: 3500,
    alertThresholdPerSecond: 10
});
