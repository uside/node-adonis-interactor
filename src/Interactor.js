"use strict";

const Sanitizer = require("./Sanitizer");
const { InteractorError, Failure, Success } = require("./Results");

module.exports = Logger => {
  return class Interactor {
    static async perform(args) {
      let start = Date.now();
      let instance = new this();

      if (instance.rules) {
        try {
          args = Sanitizer.prepare(args || {}, instance.rules);
        } catch (e) {
          instance.error("INVALID_ARGUMENTS (%j)", args);
          return new Failure("INVALID_ARGUMENTS");
        }
      }

      instance.info(`called ${args ? "with " + JSON.stringify(args) : ""}`);
      let result;
      try {
        result = new Success(await instance.perform(args));
      } catch (e) {
        if (e instanceof InteractorError) {
          instance.error(e.code);
          result = new Failure(e.code);
        } else {
          throw e;
        }
      }
      instance.info(`finished ${Date.now() - start} ms`);
      return result;
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
