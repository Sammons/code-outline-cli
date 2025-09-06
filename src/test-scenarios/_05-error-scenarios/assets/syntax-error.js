/* eslint-disable */
/**
 * File with intentional syntax errors for testing error handling
 */

// Missing closing parenthesis
function brokenFunction(param1, param2 {
  return param1 + param2;
}

// Missing closing brace
class IncompleteClass {
  constructor() {
    this.value = 42;
  
  getValue() {
    return this.value;
  }
  // Missing closing brace for class

// Invalid object literal
const malformedObject = {
  prop1: 'value1'
  prop2: 'value2' // Missing comma
  prop3: function() {
    return 'test'
  // Missing closing brace for object

// Unclosed string
const brokenString = "This string is never closed

// Invalid arrow function
const badArrow = () => {
  console.log('start')
  // Missing return or closing brace

// Malformed try-catch
try {
  someFunction();
} catch (error {
  console.error(error);
}

// Invalid for loop
for (let i = 0; i < 10 i++) {
  console.log(i);
}

// Incomplete switch
switch (value) {
  case 1:
    console.log('one');
    break;
  case 2
    console.log('two');  // Missing colon
    break;
  // Missing closing brace