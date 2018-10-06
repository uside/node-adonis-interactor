"use strict";

const typeforce = require("typeforce");
const { InteractorError, Failure, Success } = require("./Results");

module.exports = Logger => {
  return class Interactor {
    static async perform(args) {
      let start = Date.now();
      let instance = new this();
      let rules = instance.rules;

      if (rules) {
        if (!this._schema) {
          this._schema = typeforce.compile(rules);
        }

        try {
          this._schema(args || {}, true);
        } catch (e) {
          instance.error("INVALID_ARGUMENTS (%s)", e.message);
          return new Failure("INVALID_ARGUMENTS");
        }
      }

      let result;
      instance.info(`called ${args ? "with " + JSON.stringify(args) : ""}`);
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
