// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
function id(x) {
	return x[0];
}

const moo = require('moo');

const lexer = moo.compile({
	whiteSpace: { match: /[ \t\n]+/, lineBreaks: true },
	number: /(?:-|)(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)|)/,
	string: /'(?:\\['\\]|[^\n'\\])*'/,
	boolean: ['true', 'false'],
	name: { match: /[a-zA-Z_]+/ },
	context: '$',
	lparen: '(',
	rparen: ')',
	lbrack: '[',
	rbrack: ']',
	dot: '.',
	comma: ',',
	and: '&&',
	or: '||',
	comparer: ['==', '!=', '<', '>', '<=', '>='],
});
let Lexer = lexer;
let ParserRules = [
	{ name: 'expression', symbols: ['alternative'], postprocess: id },
	{ name: 'alternative', symbols: ['conjunctive'], postprocess: id },
	{
		name: 'alternative',
		symbols: ['conjunctive', '_', lexer.has('or') ? { type: 'or' } : or, '_', 'alternative'],
		postprocess: ([exprL, _, op, __, exprR]) => ({
			type: 'logical',
			op: op.text,
			left: exprL,
			right: exprR,
		}),
	},
	{ name: 'conjunctive', symbols: ['comparison'], postprocess: id },
	{
		name: 'conjunctive',
		symbols: ['comparison', '_', lexer.has('and') ? { type: 'and' } : and, '_', 'conjunctive'],
		postprocess: ([exprL, _, op, __, exprR]) => ({
			type: 'logical',
			op: op.text,
			left: exprL,
			right: exprR,
		}),
	},
	{ name: 'comparison', symbols: ['valueExpression'], postprocess: id },
	{
		name: 'comparison',
		symbols: [
			'valueExpression',
			'_',
			lexer.has('comparer') ? { type: 'comparer' } : comparer,
			'_',
			'valueExpression',
		],
		postprocess: ([exprL, _, op, __, exprR]) => ({
			type: 'comparison',
			op: op.text,
			left: exprL,
			right: exprR,
		}),
	},
	{ name: 'valueExpression', symbols: ['value'], postprocess: id },
	{ name: 'valueExpression', symbols: ['accessor'], postprocess: id },
	{ name: 'valueExpression', symbols: ['application'], postprocess: id },
	{
		name: 'valueExpression',
		symbols: [
			lexer.has('lparen') ? { type: 'lparen' } : lparen,
			'_',
			'expression',
			'_',
			lexer.has('rparen') ? { type: 'rparen' } : rparen,
		],
		postprocess: ([_, __, expr]) => expr,
	},
	{
		name: 'application',
		symbols: [
			'identifier',
			lexer.has('lparen') ? { type: 'lparen' } : lparen,
			'_',
			'argList',
			'_',
			lexer.has('rparen') ? { type: 'rparen' } : rparen,
		],
		postprocess: ([fun, _, __, args]) => ({
			type: 'application',
			fun: fun.value,
			args: args,
		}),
	},
	{ name: 'argList', symbols: [], postprocess: () => [] },
	{
		name: 'argList',
		symbols: ['expression'],
		postprocess: ([expr]) => [expr],
	},
	{
		name: 'argList',
		symbols: ['expression', '_', lexer.has('comma') ? { type: 'comma' } : comma, '_', 'argList'],
		postprocess: ([expr, _, __, ___, args]) => [expr, ...args],
	},
	{
		name: 'accessor',
		symbols: [
			lexer.has('context') ? { type: 'context' } : context,
			lexer.has('dot') ? { type: 'dot' } : dot,
			'identifier',
		],
		postprocess: ([_, __, identifier]) => ({
			type: 'accessor',
			path: [identifier],
		}),
	},
	{
		name: 'accessor',
		symbols: ['accessor', lexer.has('dot') ? { type: 'dot' } : dot, 'identifier'],
		postprocess: ([accessor, __, identifier]) => ({
			type: 'accessor',
			path: [...accessor.path, identifier],
		}),
	},
	{
		name: 'accessor',
		symbols: [
			'accessor',
			lexer.has('lbrack') ? { type: 'lbrack' } : lbrack,
			'_',
			'expression',
			'_',
			lexer.has('rbrack') ? { type: 'rbrack' } : rbrack,
		],
		postprocess: ([accessor, _, __, expr]) => ({
			type: 'accessor',
			path: [...accessor.path, expr],
		}),
	},
	{ name: 'value', symbols: ['number'], postprocess: id },
	{ name: 'value', symbols: ['string'], postprocess: id },
	{ name: 'value', symbols: ['bool'], postprocess: id },
	{
		name: 'identifier',
		symbols: [lexer.has('name') ? { type: 'name' } : name],
		postprocess: ([name]) => ({ type: 'identifier', value: name.value }),
	},
	{
		name: 'number',
		symbols: [lexer.has('number') ? { type: 'number' } : number],
		postprocess: ([number]) => ({
			type: 'number',
			value: Number.parseFloat(number),
		}),
	},
	{
		name: 'string',
		symbols: [lexer.has('string') ? { type: 'string' } : string],
		postprocess: ([str]) => ({
			type: 'string',
			value: str.text
				.substring(1, str.text.length - 1)
				.replaceAll("\\'", "'")
				.replaceAll('\\\\', '\\'),
		}),
	},
	{
		name: 'bool',
		symbols: [lexer.has('boolean') ? { type: 'boolean' } : boolean],
		postprocess: ([bool]) => ({
			type: 'bool',
			value: bool.value == 'true',
		}),
	},
	{ name: '_$ebnf$1', symbols: [] },
	{
		name: '_$ebnf$1',
		symbols: ['_$ebnf$1', lexer.has('whiteSpace') ? { type: 'whiteSpace' } : whiteSpace],
		postprocess: function arrpush(d) {
			return d[0].concat([d[1]]);
		},
	},
	{ name: '_', symbols: ['_$ebnf$1'] },
];
let ParserStart = 'expression';
export default { Lexer, ParserRules, ParserStart };
