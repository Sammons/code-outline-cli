// Sample JavaScript file for testing
const greeting = 'Hello World';

function greet(name) {
  return `${greeting}, ${name}!`;
}

const calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: function (a, b) {
    return a * b;
  },
};

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getName() {
    return this.name;
  }

  getAge() {
    return this.age;
  }
}

export { greet, calculator };
export default Person;
