import { SimpleExpression, evaluateExpression } from '../src/main.js';

describe('evaluateExpression', () => {
	describe('simple expression', () => {
		it('positive integer', () => expect(evaluateExpression('12')).toEqual(12));
		it('negative integer', () => expect(evaluateExpression('-12')).toEqual(-12));
		it('positive float', () => expect(evaluateExpression('1.5')).toEqual(1.5));
		it('negative float', () => expect(evaluateExpression('-1.5')).toEqual(-1.5));
		it('simple string', () => expect(evaluateExpression("'Abc'")).toEqual('Abc'));
		it('escaped string', () => expect(evaluateExpression("'Abc\\'s\\\\\"vow\"'")).toEqual('Abc\'s\\"vow"'));
		it('true', () => expect(evaluateExpression('true')).toEqual(true));
		it('false', () => expect(evaluateExpression('false')).toEqual(false));
	});
	describe('comparison int', () => {
		it('equals =', () => expect(evaluateExpression('12 == 12')).toEqual(true));
		it('equals +', () => expect(evaluateExpression('12 == 13')).toEqual(false));
		it('not-equals +', () => expect(evaluateExpression('12 != 13')).toEqual(true));
		it('not-equals -', () => expect(evaluateExpression('12 != 12')).toEqual(false));
		it('greater than -', () => expect(evaluateExpression('12 > 10')).toEqual(true));
		it('greater than +', () => expect(evaluateExpression('12 > 13')).toEqual(false));
		it('less than +', () => expect(evaluateExpression('12 < 13')).toEqual(true));
		it('less than -', () => expect(evaluateExpression('12 < 10')).toEqual(false));
		it('greater or equal than -', () => expect(evaluateExpression('12 >= 10')).toEqual(true));
		it('greater or equal than +', () => expect(evaluateExpression('12 >= 13')).toEqual(false));
		it('less or equal than +', () => expect(evaluateExpression('12 <= 13')).toEqual(true));
		it('less or equal than -', () => expect(evaluateExpression('12 <= 10')).toEqual(false));
	});
	// TODO: comparison for string and Date? It should all work the same though...
	describe('logical operators', () => {
		it('alternative TT', () => expect(evaluateExpression('true || true')).toEqual(true));
		it('alternative TF', () => expect(evaluateExpression('true || false')).toEqual(true));
		it('alternative FT', () => expect(evaluateExpression('false || true')).toEqual(true));
		it('alternative FF', () => expect(evaluateExpression('false || false')).toEqual(false));
		it('conjunctive TT', () => expect(evaluateExpression('true && true')).toEqual(true));
		it('conjunctive TF', () => expect(evaluateExpression('true && false')).toEqual(false));
		it('conjunctive FT', () => expect(evaluateExpression('false && true')).toEqual(false));
		it('conjunctive FF', () => expect(evaluateExpression('false && false')).toEqual(false));
		it('lazy alternative', () => {
			const f = jest.fn<boolean, [SimpleExpression]>(() => true);
			expect(evaluateExpression('true || f()', { f })).toEqual(true);
			expect(f).not.toHaveBeenCalled();
		});
		it('lazy conjunctive', () => {
			const f = jest.fn<boolean, [SimpleExpression]>(() => true);
			expect(evaluateExpression('false && f()', { f })).toEqual(false);
			expect(f).not.toHaveBeenCalled();
		});
	});
	describe('context accessor', () => {
		it('$.a', () => expect(evaluateExpression('$.a', {}, { a: 42 })).toEqual(42));
		it('$.a.b', () => expect(evaluateExpression('$.a.b', {}, { a: { b: 42 } })).toEqual(42));
		it("$.a['b']", () => expect(evaluateExpression("$.a['b']", {}, { a: { b: 42 } })).toEqual(42));
		it('$.a[0]', () => expect(evaluateExpression('$.a[0]', {}, { a: [42] })).toEqual(42));
		it('not existing property', () =>
			expect(() => evaluateExpression('$.fake', {}, {})).toThrow(
				"The context access '[fake]' resulted in a value 'undefined' which is not one of string|number|boolean|Date.",
			));
		it('complex type', () =>
			expect(() => evaluateExpression('$.a', {}, { a: {} })).toThrow(
				"The context access '[a]' resulted in a value '{}' which is not one of string|number|boolean|Date.",
			));
	});
	describe('function application', () => {
		it('user provided function ()', () => {
			const f = jest.fn<number, [SimpleExpression]>(() => 42);
			expect(evaluateExpression('f()', { f })).toEqual(42);
			expect(f).toHaveBeenCalled();
		});
		it('user provided function (a,b)', () => {
			const sum = jest.fn<number, [SimpleExpression, SimpleExpression]>((a, b) => {
				if (a.type !== 'number' || b.type !== 'number') throw 'Expected numbers';
				return a.value + b.value;
			});
			expect(evaluateExpression('sum(5, 7)', { sum })).toEqual(12);
			expect(sum).toHaveBeenCalled();
		});
		it('user provided function (expr,expr)', () => {
			const sum = jest.fn<number, [SimpleExpression, SimpleExpression]>((a, b) => {
				if (a.type !== 'number' || b.type !== 'number') throw 'Expected numbers';
				return a.value + b.value;
			});
			expect(evaluateExpression('sum(sum(2, 3), sum(4, 3))', { sum })).toEqual(12);
			expect(sum).toHaveBeenCalled();
		});
		it('user provided function returns non-scalar', () => {
			const f = jest.fn<number, [SimpleExpression]>(() => ({}) as number);
			expect(() => evaluateExpression('f()', { f })).toThrow(
				"The function 'f' returned a value '{}' which is not one of string|number|boolean|Date.",
			);
		});
		describe('built-in functions', () => {
			it('not(true)', () => expect(evaluateExpression('not(true)')).toEqual(false));
			it('not(false)', () => expect(evaluateExpression('not(false)')).toEqual(true));
			it('not() throws', () =>
				expect(() => evaluateExpression('not()')).toThrow(
					"Function 'not' expects a single bool argument, received zero arguments.",
				));
			it('not(1) throws', () =>
				expect(() => evaluateExpression('not(1)')).toThrow(
					"Function 'not' expects a single bool argument, received 'number'.",
				));
			it('not(true, 1) throws', () =>
				expect(() => evaluateExpression('not(true, 1)')).toThrow(
					"Function 'not' expects a single bool argument, received 2 arguments.",
				));

			it("date('2024-01-01')", () =>
				expect(evaluateExpression("date('2024-01-01')")).toEqual(new Date(2024, 0, 1)));
			it('date()', () =>
				expect(() => evaluateExpression('date()')).toThrow(
					"Function 'date' expects a single string argument, received zero arguments.",
				));
			it('date(1)', () =>
				expect(() => evaluateExpression('date(1)')).toThrow(
					"Function 'date' expects a single string argument, received 'number'.",
				));
			it("date('2024-01-01', 1)", () =>
				expect(() => evaluateExpression("date('2024-01-01', 1)")).toThrow(
					"Function 'date' expects a single string argument, received 2 arguments.",
				));

			it('iff(true, 42, 55)', () => expect(evaluateExpression('iff(true, 42, 55)')).toEqual(42));
			it('iff(false, 42, 55)', () => expect(evaluateExpression('iff(false, 42, 55)')).toEqual(55));
			it('iff(false, 42, 55, extraParam())', () =>
				expect(() => evaluateExpression('iff(false, 42, 55, extraParam())')).toThrow(
					"Function 'iff' expects 3 arguments, got 4.",
				));
			it('iff()', () =>
				expect(() => evaluateExpression('iff()')).toThrow(
					"Function 'iff' expects 3 arguments (bool, expression if true, expression if false).",
				));
			it('iff(true)', () =>
				expect(() => evaluateExpression('iff(true)')).toThrow(
					"Function 'iff' expects 3 arguments (bool, expression if true, expression if false).",
				));
			it('iff(5, 6, 7)', () =>
				expect(() => evaluateExpression('iff(5, 6, 7)')).toThrow(
					"Function 'iff' expects a bool value for the first argument, received 'number'.",
				));
			it('iff evaluates lazily (true)', () => {
				const f = jest.fn<number, [SimpleExpression]>(() => 42);
				const g = jest.fn<number, [SimpleExpression]>(() => 55);
				expect(evaluateExpression('iff(true, f(), g())', { f, g })).toEqual(42);
				expect(f).toHaveBeenCalled();
				expect(g).not.toHaveBeenCalled();
			});
			it('iff evaluates lazily (false)', () => {
				const f = jest.fn<number, [SimpleExpression]>(() => 42);
				const g = jest.fn<number, [SimpleExpression]>(() => 55);
				expect(evaluateExpression('iff(false, f(), g())', { f, g })).toEqual(55);
				expect(f).not.toHaveBeenCalled();
				expect(g).toHaveBeenCalled();
			});
		});
	});
});
