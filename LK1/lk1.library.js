export class Person {
  constructor(firstName, middleName, lastName, birthDate, schoolName) {
    this.firstName = firstName ?? "John";
    this.middleName = middleName;
    this.lastName = lastName ?? "Doe";
    this.birthDate = birthDate;
    this.schoolName = schoolName;
  }

  fullName() {
    return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(" ");
  }

  age() {
    if (!(this.birthDate instanceof Date)) {
      return undefined;
    }

    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    const dayDiff = today.getDate() - this.birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age;
  }

  toString() {
    return this.fullName();
  }
}

export class Teacher extends Person {
  constructor(firstName, middleName, lastName, birthDate, schoolName = "HFU") {
    super(firstName, middleName, lastName, birthDate, schoolName);
    this.schoolName = schoolName;
  }

  fullName() {
    return `${super.fullName()} @ ${this.schoolName}`;
  }
}

export function getFirstAndLastLetters(test) {
  return {
    first: test.at(0),
    last: test.at(-1),
  };
}

export function getReverse(test) {
  return test.split("").reverse().join("");
}

export function getCapitalized(test) {
  return test.map((t) => t.toUpperCase());
}

export function getOddCapitalized(test) {
  return test.map((t, i) => (i % 2 === 1 ? t.toUpperCase() : t));
}

export function* getFibonacciSequence() {
  let a = 0;
  let b = 1;

  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

export function getCopyOfArray(a) {
  return [...a];
}

export function getJsonWithNiceFormattingAndNoNumbers(obj) {
  return JSON.stringify(
    obj,
    (k, v) => (typeof v === "number" ? undefined : v),
    2,
  );
}

export function getPropertyNames(obj) {
  return Object.keys(obj);
}

export function getPropertyValues(obj) {
  return Object.values(obj);
}

export function divide(numerator, denominator) {
  if (denominator === 0) {
    return NaN;
  }

  return numerator / denominator;
}

export function strictDivide(numerator, denominator) {
  if (denominator === 0) {
    throw Error("Cannot divide by zero.");
  }

  return divide(numerator, denominator);
}

export function safeDivide(numerator, denominator) {
  try {
    return strictDivide(numerator, denominator);
  } catch {
    return NaN;
  }
}

export function getObjectWithAOnly(obj) {
  const { a } = obj;
  return { a };
}

export function getObjectWithAllButA(obj) {
  const { a, ...rest } = obj;
  return rest;
}
