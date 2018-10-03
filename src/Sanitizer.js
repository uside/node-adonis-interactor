"use strict";

class Sanitizer {
  static get types() {
    return ["number", "string", "bool", "json", "enum", "array", "nested"];
  }

  static detect(rule, key) {
    if (["number", "string", "bool", "json"].indexOf(rule) > -1) {
      return rule;
    }

    if (typeof rule == "string" && rule.slice(0, 4) == "enum") {
      return "enum";
    }

    if (typeof rule == "object" && Array.isArray(rule)) {
      return "array";
    }

    if (typeof rule == "object") {
      return "nested";
    }

    throw new Error(`Wrong ${key} rule`);
  }

  static prepare(obj, rules) {
    let result = {};

    for (let key in rules) {
      let rule = rules[key];
      let optional = rule[rule.length - 1] == "?";

      if (typeof obj[key] == "undefined" || obj[key] === null) {
        if (optional) {
          continue;
        } else {
          throw new Error(`${key} required`);
        }
      }

      if (typeof rule != "object") {
        rule = optional ? rule.slice(0, -1) : rule; // remove optional flag
      }

      result[key] = this.process(rule, key, obj[key]);
    }

    return result;
  }

  static process(rule, key, data) {
    let type = this.detect(rule, key);
    return this[type](data, rule, key);
  }

  static number(data, rule, key) {
    let num = Number(data);
    if (isNaN(num)) {
      throw new Error(`${key} should be a Number, got NaN`);
    }
    return num;
  }

  static string(data) {
    return data.toString();
  }

  static bool(data) {
    return data == "false" ? false : !!data;
  }

  static json(data, rule, key) {
    return JSON.parse(JSON.stringify(data));
  }

  static enum(data, rule, key) {
    let args = rule.slice(rule.indexOf("[") + 1, rule.indexOf("]")).split("|");

    if (rule.indexOf("[") == -1) {
      throw new Error(`${key} should have enumeration`);
    }

    let result = false;

    for (let option of args) {
      if (option == data) {
        result = option;
      }
    }

    if (!result) {
      throw new Error(`${key} should be in ${JSON.stringify(args)}`);
    }

    return result;
  }

  static array(data, rule, key) {
    let result = [];

    if (typeof rule[0] == "object") {
      for (let item of data) {
        result.push(this.prepare(item, rule[0]));
      }
    } else {
      for (let item of data) {
        result.push(this.process(rule[0], key, item));
      }
    }

    return result;
  }

  static nested(data, rule) {
    return this.prepare(data, rule);
  }
}

module.exports = Sanitizer;
