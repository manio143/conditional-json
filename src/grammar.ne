@preprocessor esmodule

@{%
import moo from 'moo';

const lexer = moo.compile({
  whiteSpace: { match: /[ \t\n]+/, lineBreaks: true },
  number: /(?:-|)(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)|)/,
  string:  /'(?:\\['\\]|[^\n'\\])*'/,
  boolean: ['true', 'false'],
  name: { match: /[a-zA-Z_]+/ },
  context: '$',
  lparen:  '(',
  rparen:  ')',
  lbrack:  '[',
  rbrack:  ']',
  dot:     '.',
  comma:   ',',
  and:     '&&',
  or:      '||',
  comparer: ['==', '!=', '<', '>', '<=', '>=']
});
%}

@lexer lexer

# The expression is composed of parts in the order of operator precedence
# Each non-terminal references a smaller non-terminal or a terminal on the left side
# to allow the grammar to be unambiguous and efficient.
expression -> alternative {% id %}

# x || y
alternative ->
    conjunctive {% id %}
  | conjunctive _ %or _ alternative {% ([exprL, _, op, __, exprR]) => ({ type: "logical", op: op.text, left: exprL, right: exprR }) %}

# x && y
conjunctive ->
    comparison {% id %}
  | comparison _ %and _ conjunctive {% ([exprL, _, op, __, exprR]) => ({ type: "logical", op: op.text, left: exprL, right: exprR }) %}

# x == y | x != y | x < y | x > y | x <= y | x >= y
comparison ->
    valueExpression {% id %}
  | valueExpression _ %comparer _ valueExpression {% ([exprL, _, op, __, exprR]) => ({ type: "comparison", op: op.text, left: exprL, right: exprR }) %}

valueExpression ->
    value {% id %}
  | accessor {% id %}
  | application {% id %}
  | %lparen _ expression _ %rparen {% ([_, __, expr]) => expr %}

# x(y)
application -> identifier %lparen _ argList _ %rparen {% ([fun, _, __, args]) => ({ type: "application", fun: fun.value, args: args }) %}
argList ->
    null {% () => [] %}
  | expression {% ([expr]) => [expr] %}
  | expression _ %comma _ argList {% ([expr, _, __, ___, args]) => [expr, ...args] %}

# $.a.b.c | $.a[0].b
accessor ->
    %context %dot identifier {% ([_, __, identifier]) => ({ type: "accessor", path: [identifier] }) %}
  | accessor %dot identifier {% ([accessor, __, identifier]) => ({ type: "accessor", path: [...accessor.path, identifier] }) %}
  | accessor %lbrack _ expression _ %rbrack {% ([accessor, _, __, expr]) => ({ type: "accessor", path: [...accessor.path, expr] }) %}

value -> number {% id %} | string {% id %} | bool {% id %}

identifier -> %name {% ([name]) => ({ type: "identifier", value: name.value }) %}
number -> %number {% ([number]) => ({ type: "number", value: Number.parseFloat(number) }) %}
string -> %string {% ([str]) => ({ type: "string", value: str.text.substring(1, str.text.length - 1).replaceAll('\\\'', '\'').replaceAll('\\\\', '\\') }) %}
bool -> %boolean {% ([bool]) => ({ type: "bool", value: bool.value == "true" }) %}

_ -> %whiteSpace:*
