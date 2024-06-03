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
		expect(applyConditionals(data, { flag: '' })).toEqual(null);
	});
});
