"use strict";

class InteractorError extends Error {
  constructor(code) {
    super();
    this.code = code;
  }
}

class Result {
  constructor(result, error = null) {
    this.value = result;
    this.error = error;
  }

  get success() {
    return !this.error;
  }
}

class Failure extends Result {
  constructor(error) {
    super(null, error);
  }
}

class Success extends Result {}

module.exports = {
  InteractorError,
  Failure,
  Success
};
