const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test("object properties work as expected", () => {
  const x = { name: "B"} ;

  expect(x.name).toBe("B");
  
});

test("arrays work as expected", () => {
  const x = [1, 2, 3];

  expect(x[0]).toBe(1);
});

test("object destructuring picks specific properties", () => {
  // Erklärung: Mit Objekt-Destrukturierung greifen wir direkt auf einzelne Felder zu.
  const user = { name: "Kosta", age: 21, city: "Furtwangen" };
  const { name, city } = user;

  expect(name).toBe("Kosta");
  expect(city).toBe("Furtwangen");
});

test("array destructuring assigns by position", () => {
  // Erklärung: Bei Arrays zählt die Position; wir können Elemente überspringen.
  const values = [10, 20, 30, 40];
  const [first, , third] = values;

  expect(first).toBe(10);
  expect(third).toBe(30);
});
