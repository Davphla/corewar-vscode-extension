const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Corewar-code activated.\n');

	const instructions = new Map([
		["name", "Reserved to the champion name. It must be under 128 bytes."],
		["comment", "Reserved to the champion comment. It must be under 2048 bytes."],
		["live", "```redcode\nlive %<4 bytes>\n```\n0x01 (live) takes 1 parameter: 4 bytes that represent the player’s number. It indicates that the player is alive."],
		["ld", "```redcode\nld arg1,arg2\n```\n0x02 (ld) takes 2 parameters. It loads the value of the first parameter into the second (which must be a register). This operation modifies the carry. The value is read starting from the address `PC + arg1 % IDX_MOD` and loaded into the register."],
		["st", "```redcode\nst arg1,arg2\n```\n0x03 (st) takes 2 parameters. It stores the first parameter’s value (which is a register) into the second (whether a register or a number). \n`st r4, 34` stores the content of `r4` at the address `PC + 34 % IDX_MOD`. \n`st r3, r8` copies the content of `r3` into `r8`."],
		["add", "```redcode\nadd r1,r2,r3\n```\n0x04 (add) takes 3 registers as parameters. It adds the content of the first two and puts the sum into the third one (which must be a register). This operation modifies the carry. \n`add r2, r3, r5` adds the content of `r2` and `r3` and puts the result into `r5`."],
		["sub", "```redcode\nsub r1,r2,r3\n```\n0x05 (sub) takes 3 registers as parameters. It subtracts the content of the second register from the first and stores the result into the third register. This operation modifies the carry. \n`sub r1, r2, r3` subtracts the content of `r2` from `r1` and stores the result in `r3`."],
		["and", "```redcode\nand arg1,arg2,arg3\n```\n0x06 (and) takes 3 parameters. It performs a binary AND between the first two parameters and stores the result into the third one (which must be a register). This operation modifies the carry. \n`and r2, %0, r3` puts `r2 & 0` into `r3`."],
		["or", "```redcode\nor arg1,arg2,arg3\n```\n0x07 (or) takes 3 parameters. It performs a binary OR between the first two parameters and stores the result into the third one (which must be a register). This operation modifies the carry. \n`or r2, %0, r3` puts `r2 | 0` into `r3`."],
		["xor", "```redcode\nxor arg1,arg2,arg3\n```\n0x08 (xor) takes 3 parameters. It performs a binary XOR (exclusive OR) between the first two parameters and stores the result into the third one (which must be a register). This operation modifies the carry. \n`xor r2, %0, r3` puts `r2 ^ 0` into `r3`."],
		["zjmp", "```redcode\nzjmp index\n```\n0x09 (zjmp) takes 1 parameter, which must be an index. It jumps to this index if the carry is worth 1. Otherwise, it does nothing but consumes the same time. \n`zjmp %23` puts, if carry equals 1, `PC + 23 % IDX_MOD` into the PC."],
		["ldi", "```redcode\nldi index1,index2,r3\n```\n0x0a (ldi) takes 3 parameters. The first two must be indexes or registers, and the third one must be a register. This operation modifies the carry. \n`ldi 3, %4, r1` reads `IND_SIZE` bytes from the address `PC + 3 % IDX_MOD`, adds 4 to this value. The sum is named `S`. `REG_SIZE` bytes are read from the address `PC + S % IDX_MOD` and copied into `r1`."],
		["sti", "```redcode\nsti r1,r2|index2,r3|index3\n```\n0x0b (sti) takes 3 parameters. The first one must be a register. The other two can be indexes or registers. \n`sti r2, %4, %5` copies the content of `r2` into the address `PC + (4+5)% IDX_MOD`."],
		["fork", "```redcode\nfork index\n```\n0x0c (fork) takes 1 parameter, which must be an index. It creates a new program that inherits different states from the parent. This program is executed at the address `PC + first parameter % IDX_MOD`."],
		["lld", "```redcode\nlld arg1,arg2\n```\n0x0d (lld) takes 2 parameters. It loads the value of the first parameter into the second (which must be a register). This operation modifies the carry. Unlike `ld`, it does not use `% IDX_MOD` for the address calculation, meaning it directly accesses memory from the given address."],
		["lldi", "```redcode\nlldi index1,index2,r3\n```\n0x0e (lldi) takes 3 parameters. The first two must be indexes or registers, and the third one must be a register. This operation modifies the carry. \n`ldi 3, %4, r1` reads `IND_SIZE` bytes from the address `PC + 3 % IDX_MOD`, adds 4 to this value, and then reads `REG_SIZE` bytes from the address `PC + S % IDX_MOD` and copies it into `r1`."],
		["lfork", "```redcode\nlfork index\n```\n0x0f (lfork) takes 1 parameter, which must be an index. It creates a new program that inherits different states from the parent. This program is executed at the address `PC + first parameter`."],
		["aff", "```redcode\naff r1\n```\n0x10 (aff) takes 1 parameter, which must be a register. It displays on the standard output the character whose ASCII code is the content of the register (in base 10). A 256 modulo is applied to this ASCII code. \n`aff r3` displays '*' if `r3` contains 42."]
	]);
	
	

	const operands = [
		{ regex: /^%[0-9\-]+$/, message: "`%` indicates a **direct value** (immediate addressing). The value is taken as-is." },
		{ regex: /^r([1-9]|1[0-6])$/, message: "`rX` refers to a **register** (r1 to r16). Must be used as destination/source of operations." },
		{ regex: /^[0-9\-]+$/, message: "This is a **numeric constant** (used as an offset or value depending on context)." },
	];

	const hoverProvider = {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position, /[%\-]?\w+/);
			if (!range) return;

			const word = document.getText(range).toLowerCase();

			// Instruction hover
			if (instructions.has(word)) {
				const md = new vscode.MarkdownString(instructions.get(word));
				md.supportHtml = true;
				md.isTrusted = true;
				return new vscode.Hover(md, range);
			}

			// Operand hover
			for (const operand of operands) {
				if (operand.regex.test(word)) {
					const md = new vscode.MarkdownString(operand.message);
					md.supportHtml = true;
					md.isTrusted = true;
					return new vscode.Hover(md, range);
				}
			}
		}
	};

	context.subscriptions.push(
		vscode.languages.registerHoverProvider('redcode', hoverProvider)
	);
}

function deactivate() {
	console.log('Corewar-code deactivated.\n');
}

module.exports = {
	activate,
	deactivate
};
