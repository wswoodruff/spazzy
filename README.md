# Spazzy

#### Http high traffic clf log monitor
Spazzy monitors an access-log file being written to by other processes, and prints to the console during times of high traffic and recovery.

## Usage

Ex:
```js
Spazzy.monitor({
    file: `${__dirname}/test/test-access.log`,
    statsInterval: 1000,
    alertTriggerDuration: 3500,
    alertThresholdPerSecond: 10
});
```

#### Options
- `file` - string - path to the file to monitor
- `statsInterval` - number - output stats every 'statsInterval' milliseconds
- `alertTriggerDuration` - number - time in milliseconds to average traffic over
- `alertThresholdPerSecond` - number - amount of logs per second that are allowed before issuing an alert
- `testMode` - boolean - silence stats output during testing

## Log generator
Useful for testing

See `scripts/start-log-generator` for an example

#### Options
- `file` - string - path to the file to write to
- `script` - [{ amount: number, duration: number }] - will generate logs according to every item in the array in sequence
    - `amount` - amount of logs to generate
    - `duration` - milliseconds to take to write these logs
- `silent` - boolean - don't log anything to the console -- (used in testing)

## Testing
Pull down the project and run `npm install && npm test`

#### Utility npm scripts
- `npm run gen` – will start the log generator, configured at `scripts/start-log-generator`
- `npm run dev` – will start spazzy monitoring, configured at `scripts/start-spazzy`
