const vscode = require('vscode');

function activate_definition(context) {
    const definitionProvider = {
        provideDefinition(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position, /%:\w+/);
            if (!wordRange) return;
            
            const word = document.getText(wordRange);
            newword = word.slice(2);

            const text = document.getText();
            const labelRegex = new RegExp(`^\\s*${newword}:`, 'gm');
            let match = labelRegex.exec(text);

            while (match !== null) {
                const startPos = document.positionAt(match.index + 1);
                const labelRange = new vscode.Range(startPos, startPos.translate(0, newword.length));
                return new vscode.Location(document.uri, labelRange);
            } 
            
            return null;
        }
    };

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider('redcode', definitionProvider)
    );
}

module.exports = { activate_definition };
