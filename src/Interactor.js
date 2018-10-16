"use strict";

const typeforce = require("typeforce");
const { InteractorError, Failure, Success } = require("./Results");

module.exports = Logger => {
  return class Interactor {
    static perform(args) {
      let instance = new this();
      instance._unwrapped = false;

      let exec = new Promise((resolve, reject) => {
        this.invoke(instance, args).then(result => {
          if (instance._unwrapped) {
            resolve(result.value);
          } else {
            resolve(result);
          }
        }, reject);
      });

      exec.unwrap = () => {
        instance._unwrapped = true;
        return exec;
      };

      return exec;
    }

    static async invoke(instance, args) {
      let start = Date.now();
      let rules = instance.rules;

      let result;
      instance.info("called");

      if (instance.before) {
        await instance.before();
      }

      try {
        if (rules) {
          if (!this._schema) {
            this._schema = typeforce.compile(rules);
          }

          try {
            this._schema(args || {}, true);
          } catch (e) {
            instance.error("INVALID_ARGUMENTS (%s)", e.message);
            instance.fail("INVALID_ARGUMENTS");
          }
        }

        result = new Success(await instance.perform(args));
      } catch (e) {
        if (e instanceof InteractorError && !instance._unwrapped) {
          instance.error(e.code);
          result = new Failure(e.code);
        } else {
          throw e;
        }
      } finally {
        if (instance.after) {
          await instance.after();
        }
      }

      instance.info(`finished ${Date.now() - start} ms`);
      return result;
    }

    get schema() {
      return typeforce;
    }

    fail(code) {
      throw new InteractorError(code);
    }

    error(msg, ...args) {
      Logger.error(`[${this.constructor.name}] ${msg}`, ...args);
    }

    info(msg, ...args) {
      Logger.info(`[${this.constructor.name}] ${msg}`, ...args);
    }

    warn(msg, ...args) {
      Logger.warn(`[${this.constructor.name}] ${msg}`, ...args);
    }
  };
};
