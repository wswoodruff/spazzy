'use strict';

const Url = require('url');
const SliceFile = require('slice-file');
const ClfParser = require('../utils/parse-common-log-format');

const spazzy = exports;

const internals = {};

spazzy.monitor = (options) => {

    options.file = options.file || '/var/log/access.log';
    options.statsInterval = options.statsInterval || 10000; // 10 seconds in ms
    options.alertTriggerDuration = options.alertTriggerDuration || 120000; // 2 minutes in ms
    options.alertThresholdPerSecond = options.alertThresholdPerSecond || 10;

    const followStream = SliceFile(options.file).follow(-1);

    let linesTracked = 0;
    let totalBytes = 0;

    let intervalInfo = internals.getNewIntervalInfo();
    let alertInfo = internals.getNewAlertInfo();

    followStream.on('data', (data) => {

        linesTracked++;
        const parsed = ClfParser(data.toString('utf8'));

        if (parsed) {
            const numBytes = parsed.bytes === '-' ? 0 : Number(parsed.bytes);

            totalBytes += numBytes;
            intervalInfo.bytes += numBytes;
            intervalInfo.linesTracked++;

            const asUrl = Url.parse(parsed.endpoint).pathname.toLowerCase().split('/');

            const section = asUrl.length === 2 ? '/' : asUrl[1];

            if (!intervalInfo.sectionHits[section]) {
                intervalInfo.sectionHits[section] = 0;
            }

            intervalInfo.sectionHits[section]++;
        }
    });

    followStream.on('error', (data) => {

        console.log('error:', data);
    });

    setInterval(() => {

        const intervalInfoClone = { ...intervalInfo, sectionHits: { ...intervalInfo.sectionHits } };

        // I know objects don't have any guaranteed order, but chances
        // are in the terminal these will be sorted by most hits on top
        // TODO show this info sorted in a different way
        intervalInfoClone.sectionHits = Object.keys(intervalInfoClone.sectionHits)
            .sort((a, b) => intervalInfoClone.sectionHits[b] - intervalInfoClone.sectionHits[a])
            .reduce((collector, key) => {

                collector[key] = intervalInfoClone.sectionHits[key];
                return collector;
            }, {});

        if (!options.testMode) {
            console.log({ linesTracked, totalBytes, intervalInfo: intervalInfoClone });
        }

        alertInfo = internals.manageAlerts(alertInfo, options.alertThresholdPerSecond, intervalInfo, options.alertTriggerDuration, options.statsInterval);

        // reset vars to defaults
        intervalInfo = internals.getNewIntervalInfo();

    }, options.statsInterval);
};

internals.getNewIntervalInfo = () => ({
    sectionHits: {},
    bytes: 0,
    linesTracked: 0
});

internals.getNewAlertInfo = () => ({
    hitCounts: [],
    onAlert: false
});

internals.manageAlerts = (alertInfo, alertThresholdPerSecond, intervalInfo, alertTriggerDuration, statsInterval) => {

    const alertInfoClone = { ...alertInfo, hitCounts: [...alertInfo.hitCounts] };

    const maxHitsLength = Math.ceil(alertTriggerDuration / statsInterval);

    if (alertInfoClone.hitCounts.length >= maxHitsLength) {
        // Remove oldest count
        alertInfoClone.hitCounts.shift();
    }

    alertInfoClone.hitCounts.push(intervalInfo.linesTracked);

    const totalHits = alertInfoClone.hitCounts.reduce((total, hits) => total + hits, 0);

    const avgHitsPerInterval = totalHits / alertInfoClone.hitCounts.length;
    const secondsPerInterval = statsInterval / 1000;
    const hitsPerSecond = avgHitsPerInterval / secondsPerInterval;

    if (hitsPerSecond >= alertThresholdPerSecond) {
        if (!alertInfoClone.onAlert) {
            console.log(`High traffic generated an alert - (hits / second) = ${hitsPerSecond}, triggered at ${new Date()}`);
            alertInfoClone.onAlert = true;
        }
    }
    else {
        if (alertInfoClone.onAlert) {
            console.log(`Recovered from high traffic at ${new Date()}`);
            alertInfoClone.onAlert = false;
        }
    }

    return alertInfoClone;
};
