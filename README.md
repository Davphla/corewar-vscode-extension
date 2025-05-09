# Corewar Instruction Helper

A lightweight VSCode extension that provides inline help and syntax info for Corewar assembly instructions.

## Features

- Hover tooltips with opcode, syntax, and descriptions  
- Instruction formatting based on the Corewar specification  
- Supports Redcode-style syntax

## Example

Hovering over this code:

```redcode
add r1, r2, r3
```

Shows:

```
Opcode: 0x04  
Adds r1 and r2, stores the result in r3.  
Modifies the carry flag.
```

## Supported Instructions

Includes tooltips for all Corewar instructions:

* `live`, `ld`, `st`, `add`, `sub`
* `and`, `or`, `xor`, `zjmp`
* `ldi`, `sti`, `fork`, `lld`, `lldi`
* `lfork`, `aff`

## How to Use

Just install the extension, open a `.s` file, and start writing Corewar code. Hover over any instruction for instant documentation.

## Contributing

Feel free to submit issues or pull requests!

## License

MIT
