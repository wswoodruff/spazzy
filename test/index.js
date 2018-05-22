'use strict';

const Code = require('code');
const Lab = require('lab');

const LogGenerator = require('../utils/log-generator');
const Spazzy = require('../lib');

const internals = {};

// Test shortcuts

const lab = exports.lab = Lab.script();

const { expect } = Code;
const { describe, it } = lab;

// Modify console.log so we can test its output

const oldLog = console.log;
console._log = oldLog;

let logs = [];

console.log = (...args) => {

    logs.push(...args);
};

const clearLogs = () => {

    logs = [];
};

describe('Spazzy', () => {

    it('logs a high traffic message if logs per second cross the threshold, logs recovery message on lower traffic', async (flags) => {

        flags.onCleanup = clearLogs;

        const spazzyScript = [
            { amount: 150, duration: 4000 },
            { amount: 4, duration: 3000 },
            { amount: 130, duration: 3000 }
        ];

        const logFile = `${__dirname}/test-access.log`;

        LogGenerator.start({
            script: spazzyScript,
            file: logFile,
            silent: true
        });

        Spazzy.monitor({
            file: logFile,
            statsInterval: 100,
            alertTriggerDuration: 500,
            alertThresholdPerSecond: 10,
            testMode: true
        });

        await internals.wait(10000);

        expect(logs[0]).to.startWith('High traffic generated an alert - (hits / second)');
        expect(logs[1]).to.startWith('Recovered from high traffic at');
        expect(logs[2]).to.startWith('High traffic generated an alert - (hits / second)');
    });
});

internals.wait = (ms) => new Promise((r, j) => setTimeout(r, ms));
