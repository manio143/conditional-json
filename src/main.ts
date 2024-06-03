import { Parser, Grammar } from 'nearley';
import grammarDefinition from './grammar.js';

// type Settings = {
// 	stopOnInvalidExpression: boolean;
// };

export type SimpleExpression =
	| { type: 'identifier'; value: string }
	| { type: 'number'; value: number }
	| { type: 'string'; value: string }
	| { type: 'bool'; value: boolean }
	| { type: 'date'; value: Date };
export type Expression =
	| SimpleExpression
	| { type: 'accessor'; path: Expression[] }
	| { type: 'application'; fun: string; args: Expression[] }
	| {
			type: 'comparison';
			left: Expression;
			right: Expression;
			op: '==' | '!=' | '<' | '>' | '<=' | '>=';
	  }
	| { type: 'logical'; left: Expression; right: Expression; op: '&&' | '||' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EvaluationContext = { [k: string]: any };

type FunctionStore = {
	[k: string]: (...args: SimpleExpression[]) => SimpleExpression['value'];
};

const pick = (context: EvaluationContext, path: SimpleExpression[]): unknown => {
	const pathValues = path.map((e) => e.value.toString());
	let obj: unknown = context;
	for (const step of pathValues) {
		if (obj === undefined || typeof obj !== 'object') return undefined;
		obj = obj[step];
	}
	return obj;
};

const evaluate_ = (expr: Expression, functions: FunctionStore, context: EvaluationContext): SimpleExpression => {
	switch (expr.type) {
		case 'string':
		case 'number':
		case 'date':
		case 'identifier':
		case 'bool':
			return expr;
		case 'accessor': {
			const evalutedPath = expr.path.map((e) => evaluate_(e, functions, context));
			const value = pick(context, evalutedPath);
			if (typeof value === 'number') return { type: 'number', value: value };
			else if (typeof value === 'string') return { type: 'string', value: value };
			else if (typeof value === 'boolean') return { type: 'bool', value: value };
			else if (value instanceof Date) return { type: 'date', value: value };
			else
				throw `The context access '${evalutedPath.map((e) => `[${e.value.toString()}]`).join()}' resulted in a value '${value === undefined ? 'undefined' : JSON.stringify(value)}' which is not one of string|number|boolean|Date.`;
		}
		case 'application': {
			if (Object.hasOwn(specialFunctions, expr.fun)) {
				return specialFunctions[expr.fun]((e) => evaluate_(e, functions, context)).apply({}, expr.args);
			}
			const func = functions[expr.fun];
			if (func === undefined) throw `The function '${expr.fun}' was not found.`;
			const args = expr.args.map((e) => evaluate_(e, functions, context));
			const value = func.apply({}, args);
			if (typeof value === 'number') return { type: 'number', value: value };
			else if (typeof value === 'string') return { type: 'string', value: value };
			else if (typeof value === 'boolean') return { type: 'bool', value: value };
			else if (value instanceof Date) return { type: 'date', value: value };
			else
				throw `The function '${expr.fun}' returned a value '${JSON.stringify(value)}' which is not one of string|number|boolean|Date.`;
		}
		case 'comparison': {
			const left = evaluate_(expr.left, functions, context);
			const right = evaluate_(expr.right, functions, context);
			switch (expr.op) {
				case '==':
					return { type: 'bool', value: left.value === right.value };
				case '!=':
					return { type: 'bool', value: left.value !== right.value };
				case '<':
					return { type: 'bool', value: left.value < right.value };
				case '>':
					return { type: 'bool', value: left.value > right.value };
				case '<=':
					return { type: 'bool', value: left.value <= right.value };
				case '>=':
					return { type: 'bool', value: left.value >= right.value };
			}
			break;
		}
		case 'logical': {
			const left = evaluate_(expr.left, functions, context);
			if (left.type !== 'bool') throw `Expression evaluated to value '${left.value}', but expected a boolean.`;
			// lazy evaluation, return fast if left implies the result
			if (expr.op === '||' && left.value) return { type: 'bool', value: true };
			if (expr.op === '&&' && !left.value) return { type: 'bool', value: false };
			const right = evaluate_(expr.right, functions, context);
			if (right.type !== 'bool') throw `Expression evaluated to value '${right.value}', but expected a boolean.`;
			if (expr.op === '||') return { type: 'bool', value: left.value || right.value };
			if (expr.op === '&&') return { type: 'bool', value: left.value && right.value };

			throw `Unknown comparison operator '${expr.op}'`;
		}
	}
};

const builtInFunctions: FunctionStore = {
	date: (strExpr, ...rest) => {
		if (!strExpr) throw `Function 'date' expects a single string argument, received zero arguments.`;
		if (strExpr.type !== 'string')
			throw `Function 'date' expects a single string argument, received '${strExpr.type}'.`;
		if (rest.length > 0)
			throw `Function 'date' expects a single string argument, received ${rest.length + 1} arguments.`;
		return new Date(strExpr.value);
	},
	not: (boolExpr, ...rest) => {
		if (!boolExpr) throw `Function 'not' expects a single bool argument, received zero arguments.`;
		if (boolExpr.type !== 'bool')
			throw `Function 'not' expects a single bool argument, received '${boolExpr.type}'.`;
		if (rest.length > 0)
			throw `Function 'not' expects a single bool argument, received ${rest.length + 1} arguments.`;
		return !boolExpr.value;
	},
};

const specialFunctions: {
	[k: string]: (evaluate: (e: Expression) => SimpleExpression) => (...args: Expression[]) => SimpleExpression;
} = {
	iff:
		(evaluate: (e: Expression) => SimpleExpression) =>
		(boolExpr: Expression, ifTrue: Expression, ifFalse: Expression, ...rest: Expression[]) => {
			if (rest.length > 0) throw `Function 'iff' expects 3 arguments, got ${3 + rest.length}.`;
			if (!boolExpr || !ifFalse || !ifTrue)
				throw `Function 'iff' expects 3 arguments (bool, expression if true, expression if false).`;
			boolExpr = evaluate(boolExpr);
			if (boolExpr.type !== 'bool')
				throw `Function 'iff' expects a bool value for the first argument, received '${boolExpr.type}'.`;

			if (boolExpr.value) return evaluate(ifTrue);
			else return evaluate(ifFalse);
		},
};

const grammar = Grammar.fromCompiled(grammarDefinition);

export const evaluateExpression = (
	s: string,
	functions?: FunctionStore,
	context?: EvaluationContext,
): SimpleExpression['value'] => {
	const parser = new Parser(grammar);
	parser.feed(s.trim());
	const expr = parser.finish()[0] as Expression;
	const functionStore = {
		...builtInFunctions,
		...(functions ?? {}),
	};
	return evaluate_(expr, functionStore, context ?? {}).value;
};

export const applyConditionals = (
	data: unknown,
	context?: EvaluationContext,
	errorLogger?: (error: string) => void,
	userFunctions?: FunctionStore,
	breakOnError?: boolean,
): unknown => {
	if (typeof data === 'string' && data.startsWith('[') && data.endsWith(']')) {
		try {
			const result = evaluateExpression(data.substring(1, data.length - 1), userFunctions, context);
			return result;
		} catch (reason) {
			if (breakOnError) throw reason;
			errorLogger && errorLogger(reason);
			return data;
		}
	}
	if (typeof data !== 'object') return data;
	else if (Array.isArray(data))
		return data
			.map((d) => applyConditionals(d, context, errorLogger, userFunctions, breakOnError))
			.filter((d) => d !== undefined);

	if (Object.keys(data).every((key) => key.startsWith('$if['))) {
		for (const [key, entry] of Object.entries(data)) {
			const expr = key.substring(4, key.length - 1);
			try {
				const result = evaluateExpression(expr, userFunctions, context);
				if (typeof result !== 'boolean') {
					const reason = `Conditional expression evaluated to a non boolean value: ${key}`;
					if (breakOnError) throw reason;
					errorLogger && errorLogger(reason);
				} else if (result) return applyConditionals(entry, context, errorLogger, userFunctions, breakOnError);
			} catch (reason) {
				if (breakOnError) throw reason;
				errorLogger && errorLogger(reason);
			}
		}
		return undefined;
	} else {
		const newObj = {};
		for (const [key, entry] of Object.entries(data)) {
			newObj[key] = applyConditionals(entry, context, errorLogger, userFunctions, breakOnError);
		}
		return newObj;
	}
};
