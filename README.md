# conditional-json

Library for evalutating expressions in JSON data.

## Example

```json
{
    "House": {
        "Doors": 1,
        "Windows: "[$ctx.windows]",
        "Basement": {
            "$if[$ctx.includeBasement]": {
                "Rooms": 2
            }
        }
    }
}
```

```typescript
import { Conditional } from "conditional-json";

let data = JSON.parse(text);
let evaluted = Conditional.eval(data, {windows: 4, includeBasement: true});
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
