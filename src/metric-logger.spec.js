'use strict';

const metricLoggerFactory = require('./metric-logger');
const Logger = require('@emartech/json-logger').Logger;
const fakeTimers = require('@sinonjs/fake-timers');

jest.spyOn(Logger.prototype, 'info');
let metricLogger;
let clock;
beforeEach(() => {
  jest.resetAllMocks();
  metricLogger = metricLoggerFactory();
  clock = fakeTimers.install();
});
afterEach(() => clock.uninstall());

describe('metricLogger', () => {
  describe('count', () => {
    it('should log a single measurement at the next flush period', () => {
      metricLogger.count('elfogyasztot-tap', 4);

      clock.tick(60 * 1000 + 1);
      expect(Logger.prototype.info).toBeCalledWith('elfogyasztot-tap', {
        min: 4,
        max: 4,
        count: 1,
        sum: 4,
        avarage: 4
      });
    });

    it('should aggregate measurements withing a flush period', () => {
      metricLogger.count('elfogyasztot-tap', 4);
      metricLogger.count('elfogyasztot-tap', 8);
      metricLogger.count('kacsa-cucc', 18);

      clock.tick(60 * 1000 + 1);
      expect(Logger.prototype.info).toBeCalledWith('elfogyasztot-tap', {
        min: 4,
        max: 8,
        count: 2,
        sum: 12,
        avarage: 6
      });
      expect(Logger.prototype.info).toBeCalledWith('kacsa-cucc', {
        min: 18,
        max: 18,
        count: 1,
        sum: 18,
        avarage: 18
      });
    });

    it('should log counts for each combination of extra params provedid within a tag', () => {
      metricLogger.count('elfogyasztot-tap', 4, { emberke: 'bela' });
      metricLogger.count('elfogyasztot-tap', 8, { emberke: 'bela' });
      metricLogger.count('elfogyasztot-tap', 18, { emberke: 'jano' });

      clock.tick(60 * 1000 + 1);
      expect(Logger.prototype.info).toBeCalledWith('elfogyasztot-tap', {
        min: 4,
        max: 8,
        count: 2,
        sum: 12,
        avarage: 6,
        emberke: 'bela'
      });
      expect(Logger.prototype.info).toBeCalledWith('elfogyasztot-tap', {
        min: 18,
        max: 18,
        count: 1,
        sum: 18,
        avarage: 18,
        emberke: 'jano'
      });
    });

    it('should group logs with same tag and deeply equal params together', () => {
      metricLogger.count('elfogyasztot-tap', 4, { a: 1, b: 2 });
      metricLogger.count('elfogyasztot-tap', 8, { b: 2, a: 1 });

      clock.tick(60 * 1000 + 1);
      expect(Logger.prototype.info).toBeCalledWith('elfogyasztot-tap', {
        min: 4,
        max: 8,
        count: 2,
        sum: 12,
        avarage: 6,
        a: 1,
        b: 2
      });
    });
  });

  describe('start/stop', () => {
    it('should log min, max, count and sum when log was called only once', () => {
      const measurementId = metricLogger.start('utlegeles');
      clock.tick(50);
      metricLogger.stop(measurementId);

      clock.tick(60 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', {
        min: 50,
        max: 50,
        count: 1,
        sum: 50,
        avarage: 50
      });
    });

    it('should aggregate metrics for two measurements and log after a timeout', () => {
      const measurement1Id = metricLogger.start('utlegeles');
      const measurement2Id = metricLogger.start('utlegeles');
      clock.tick(50);
      metricLogger.stop(measurement1Id);
      clock.tick(20);
      metricLogger.stop(measurement2Id);

      clock.tick(60 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', {
        min: 50,
        max: 70,
        sum: 120,
        count: 2,
        avarage: 60
      });
    });

    it('should flush results at the closes minute:30', () => {
      const measurementId = metricLogger.start('utlegeles');
      metricLogger.stop(measurementId);

      clock.tick(29 * 1000 + 999);
      expect(Logger.prototype.info).not.toBeCalled();
      clock.tick(1 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', expect.anything());
    });

    it('should flush at next minute:30 if we are after 30 in current minute', () => {
      clock.tick(45 * 1000);
      const measurementId = metricLogger.start('utlegeles');
      metricLogger.stop(measurementId);

      clock.tick(44 * 1000);
      expect(Logger.prototype.info).not.toBeCalled();
      clock.tick(1 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', expect.anything());
    });

    it('should periodically log measuerments', () => {
      const measurement1 = metricLogger.start('utlegeles');
      const measurement2 = metricLogger.start('utlegeles');
      clock.tick(10 * 1000);
      const measurement3 = metricLogger.start('utlegeles');
      metricLogger.stop(measurement1);

      clock.tick(21 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', {
        count: 1,
        max: 10000,
        min: 10000,
        sum: 10000,
        avarage: 10000
      });

      metricLogger.stop(measurement2);
      metricLogger.stop(measurement3);
      clock.tick(60 * 1000);
      expect(Logger.prototype.info).toBeCalledWith('utlegeles', {
        count: 2,
        max: 31000,
        min: 21000,
        sum: 52000,
        avarage: 26000
      });
    });

    it('should log measurements for multiple tags and include extra parameters', () => {
      const measurement1 = metricLogger.start('utlegeles', { a: 21 });
      const measurement2 = metricLogger.start('nyavogas');
      clock.tick(10 * 1000);
      metricLogger.stop(measurement1);
      clock.tick(5 * 1000);
      metricLogger.stop(measurement2);
      clock.tick(15 * 1000);

      expect(Logger.prototype.info).toBeCalledWith('utlegeles', {
        count: 1,
        max: 10000,
        min: 10000,
        sum: 10000,
        avarage: 10000,
        a: 21
      });
      expect(Logger.prototype.info).toBeCalledWith('nyavogas', {
        count: 1,
        max: 15000,
        min: 15000,
        sum: 15000,
        avarage: 15000
      });
    });
  });
});
