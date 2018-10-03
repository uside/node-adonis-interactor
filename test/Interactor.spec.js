const test = require("japa");
const Interactor = require("../src/Interactor")({
  info: () => {},
  warn: () => {},
  error: () => {}
});

test("works", async assert => {
  class Test extends Interactor {
    async perform() {
      return {
        passed: true
      };
    }
  }

  let result = await Test.perform();
  assert.equal(result.success, true);
  assert.equal(result.value.passed, true);
});

test("validates", async assert => {
  class Test extends Interactor {
    get rules() {
      return { arg: "string" };
    }

    async perform({ arg }) {
      return arg;
    }
  }

  let invalid = await Test.perform();
  assert.equal(invalid.success, false);
  assert.equal(invalid.error, "INVALID_ARGUMENTS");

  let valid = await Test.perform({ arg: "test" });
  assert.equal(valid.success, true);
  assert.equal(valid.error, null);
  assert.equal(valid.value, "test");
});

test("fails correctly", async assert => {
  let called = false;

  class Test extends Interactor {
    async perform() {
      this.fail("MY_ERROR");
      called = true;
    }
  }

  let result = await Test.perform();
  assert.equal(result.success, false);
  assert.equal(result.error, "MY_ERROR");
  assert.equal(called, false);
});

test("throws unhandled exception", async assert => {
  class Test extends Interactor {
    async perform() {
      throw new Error("Test");
    }
  }

  try {
    await Test.perform();
  } catch ({ message }) {
    assert.equal(message, "Test");
  }
});
