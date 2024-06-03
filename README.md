# conditional-json

Library for evaluating expressions in JSON data.

## Example

```json
{
    "House": {
        "Doors": 1,
        "Windows: "[$.windows]",
        "Basement": {
            "$if[$.basementRooms > 0]": {
                "Rooms": "[$.basementRooms]"
            }
        }
    }
}
```

```typescript
import { Conditional } from 'conditional-json';

let data = JSON.parse(text);
let evaluted = Conditional.eval(data, { windows: 4, basementRooms: 2 });
// {
//     "House": {
//         "Doors": 1,
//         "Windows": 4,
//         "Basement": {
//             "Rooms": 2
//         }
//     }
// }
```

## Expression language

The language is fairly simple:
1. Lazy logical operators `&&` and `||`
2. Comparison operators `==`, `!=`, `<`, `>`, `<=`, `>=`
3. Function application `f(e1, e2, ...)`
4. Context access `$.a.b[0]`
5. Constants `12`, `'Abc'`, `true`

Built-in functions:
* `date(string)` - converts a string into a date
* `not(bool)` - inverts a boolean value
* `iff(bool, ifTrue, ifFalse)` - lazy conditional function
