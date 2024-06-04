import { applyConditionals } from '../src/main.js';

describe('applyConditionals', () => {
	it('inlineExpression', () => {
		const data = {
			a: "[iff($.t > 0, $.t, 'abc')]",
		};
		expect(applyConditionals(data, { t: 5 })).toEqual({ a: 5 });
		expect(applyConditionals(data, { t: 0 })).toEqual({ a: 'abc' });
	});
	it('object conditional', () => {
		const data = {
			"$if[$.flag == 'Test']": {
				a: 12,
			},
		};
		expect(applyConditionals(data, { flag: 'Test' })).toEqual({ a: 12 });
		expect(applyConditionals(data, { flag: '' })).toEqual(undefined);
	});
	it('array with a conditional inside', () => {
		const data = [
			{
				"$if[$.flag == 'Test']": {
					a: 12,
				},
			},
		];
		expect(applyConditionals(data, { flag: 'Test' })).toEqual([{ a: 12 }]);
		expect(applyConditionals(data, { flag: '' })).toEqual([]);
	});
	it('deep nested conditional', () => {
		const data = {
			a: {
				b: {
					"$if[$.flag == 'Test']": {
						c: 12,
					},
				},
			},
		};
		expect(applyConditionals(data, { flag: 'Test' })).toEqual({ a: { b: { c: 12 } } });
		expect(applyConditionals(data, { flag: '' })).toEqual({ a: {} });
	});
	it('chooses first matching condition', () => {
		const data = {
			'$if[$.option == 1]': 12,
			'$if[$.option == 2]': 42,
			'$if[true]': 0,
		};
		expect(applyConditionals(data, { option: 1 })).toEqual(12);
		expect(applyConditionals(data, { option: 2 })).toEqual(42);
		expect(applyConditionals(data, { option: 5 })).toEqual(0);
	});
	it('invalid inline expression, breakOnError: false', () => {
		const data = {
			a: '[iff()]',
		};
		const error: string[] = [];
		expect(applyConditionals(data, {}, (err) => error.push(err))).toEqual(data);
		expect(error).toEqual([
			"Failed to evaluate conditional expression '[iff()]' -> Function 'iff' expects 3 arguments (bool, expression if true, expression if false).",
		]);
	});
	it('invalid inline expression, breakOnError: true', () => {
		const data = {
			a: '[iff()]',
		};
		expect(() => applyConditionals(data, {}, undefined, undefined, true)).toThrow(
			"Failed to evaluate conditional expression '[iff()]' -> Function 'iff' expects 3 arguments (bool, expression if true, expression if false).",
		);
	});
	it('invalid conditional, breakOnError: false', () => {
		const data = {
			'$if[$.option == f()]': 12,
			'$if[$.option == g()]': 42,
			'$if[true]': 0,
		};
		const error: string[] = [];
		expect(applyConditionals(data, { option: 1 }, (err) => error.push(err))).toEqual(0);
		expect(error).toEqual([
			"Failed to evaluate conditional expression '$if[$.option == f()]' -> The function 'f' was not found.",
			"Failed to evaluate conditional expression '$if[$.option == g()]' -> The function 'g' was not found.",
		]);
	});
	it('invalid conditional, breakOnError: true', () => {
		const data = {
			'$if[$.option == f()]': 12,
			'$if[$.option == g()]': 42,
			'$if[true]': 0,
		};
		expect(() => applyConditionals(data, { option: 1 }, undefined, undefined, true)).toThrow(
			"Failed to evaluate conditional expression '$if[$.option == f()]' -> The function 'f' was not found.",
		);
	});
	it('invalid conditional value type, breakOnError: false', () => {
		const data = {
			'$if[5]': 12,
		};
		const error: string[] = [];
		expect(applyConditionals(data, { option: 1 }, (err) => error.push(err))).toEqual(undefined);
		expect(error).toEqual(['Conditional expression evaluated to a non boolean value: $if[5]']);
	});
	it('invalid conditional value type, breakOnError: true', () => {
		const data = {
			'$if[5]': 12,
		};
		expect(() => applyConditionals(data, { option: 1 }, undefined, undefined, true)).toThrow(
			'Conditional expression evaluated to a non boolean value: $if[5]',
		);
	});
	it('from JSON string', () => {
		const data = JSON.parse('{ "$if[true]": "[iff(true, 42, 55)]" }');
		expect(applyConditionals(data)).toEqual(42);
	});
});
