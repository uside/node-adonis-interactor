const test = require("japa");
const Interactor = require("../src/Interactor")({
  info: () => {},
  warn: () => {},
  error: () => {}
});

test.group("Without nesting", () => {
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

  test("validates simple types", async assert => {
    class Test extends Interactor {
      get rules() {
        return { arg: "String" };
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

  test("validates extended types", async assert => {
    class Test extends Interactor {
      get rules() {
        return { arg: this.schema.oneOf("String", "Number") };
      }

      async perform({ arg }) {
        return arg;
      }
    }

    let empty = await Test.perform();
    assert.equal(empty.success, false);
    assert.equal(empty.error, "INVALID_ARGUMENTS");

    let invalid = await Test.perform({ arg: true });
    assert.equal(invalid.success, false);
    assert.equal(invalid.error, "INVALID_ARGUMENTS");

    let valid_str = await Test.perform({ arg: "test" });
    assert.equal(valid_str.success, true);
    assert.equal(valid_str.error, null);
    assert.equal(valid_str.value, "test");

    let valid_number = await Test.perform({ arg: 5 });
    assert.equal(valid_number.success, true);
    assert.equal(valid_number.error, null);
    assert.equal(valid_number.value, 5);
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
});

test.group("With nesting", () => {
  test("parent interactor fails", async assert => {
    class Test extends Interactor {
      async perform() {
        this.fail("MY_ERROR");
      }
    }

    class Parent extends Interactor {
      async perform() {
        await Test.perform().unwrap();
      }
    }

    let result = await Parent.perform();
    assert.equal(result.success, false);
    assert.equal(result.error, "MY_ERROR");
  });

  test("unwrap works", async assert => {
    class Test extends Interactor {
      async perform() {
        return "test";
      }
    }

    class Parent extends Interactor {
      async perform() {
        return await Test.perform().unwrap();
      }
    }

    let result = await Parent.perform();
    assert.equal(result.success, true);
    assert.equal(result.value, "test");
  });
});

test.group("Hooks", () => {
  test("called even if #perform fails", async assert => {
    let before_called = false;
    let after_called = false;

    class Test extends Interactor {
      async before() {
        before_called = true;
      }

      async after() {
        after_called = true;
      }

      async perform() {
        this.fail("MY_ERROR");
      }
    }

    let result = await Test.perform();
    assert.equal(result.success, false);
    assert.equal(result.error, "MY_ERROR");
    assert.equal(before_called, true);
    assert.equal(after_called, true);
  });
});
