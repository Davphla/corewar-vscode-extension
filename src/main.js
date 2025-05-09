
const vscode = require('vscode');
const { activate_hover } = require('./extension'); 

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Corewar-code activated.\n');
    activate_hover(context)
}


function deactivate() {
    console.log('Corewar-code deactivated.\n');
}

module.exports = {
    activate,
    deactivate
};
