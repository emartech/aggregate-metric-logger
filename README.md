# aggregate-metric-logger
aggregate metrics in memory and log them every minute

## Setup

Set `METRIC_LOGGER_ENABLED` env variable to `true` for aggregate-metric-logger to
start collecting and logging measurements.

To change the default `aggregate-metric-logger` namespace used for logs, set
`METRIC_LOGGER_NAMESPACE` to a custom value.

## Usage

The package exposes similar logging methods as the `@emartech/json-logger` package:
`trace`, `debug`, `info`, `warn`, `error` and `fatal`.

When these are called, it will aggregate logs with the same parameters withing a minute, add
an extra `count` property to the logs and log them at the end of the minute with
`@emartech/json-logger`.

```js
const metricLogger = require('@emartech/aggregate-metric-logger')

metricLogger.warn('etwas-went-wrong', { customer_id: 11 });
metricLogger.warn('etwas-went-wrong', { customer_id: 11 });

// will aggrete these to a single warning log
```

### Measure values

If you want aggregate measurements about something you need to simply call the `measure` method
for each value:

```js
const metricLogger = require('@emartech/aggregate-metric-logger')

metricLogger.measure('thing-to-measure', 14)
metricLogger.measure('thing-to-measure', 20)
```

Every minute metric logger will log `min`, `max`, `sum`, `count` and `average` aggregated metrics
for each measured tags. (Uses `@emartech/json-logger` behind the scenes for logging).

### Measuring durations

For duration measurements, there are two convenient methods: `start`, and `stop`;

You start the measurement with `start`, the counted value for aggregation will be the duration
between this `start` and the matching `stop` call;

```js
function exampleIOHeavyFunction() {
  const measurement = metricLogger.start('tag-for-the-measuement');
  const result = db.findItems();
  metricLogger.stop(measurement);
  return result;
}
```

### Group by extra parameters

If you want to group by additional parameters inside a tag, you can pass down these extra
params in an object to `measure` and `start` as the last optional argument:

```js
metricLogger.measure('thing-to-count', 14, { customer_id: 12 });

const measurement = metricLogger.start(
  'tag-for-the-measuement',
  { event_type: 'nyul', account: 3 }
);
```

A separate log entry will be created for each seen value combinations seen in the extra params
and these extra params will be appended to the log entry.

Be very careful when using extra params, and only include information you really need.
If you include too many parameters, you could lose the advantage you gain by aggregating your logs
with this package.
