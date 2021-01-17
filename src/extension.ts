// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { outputFileSync } from 'fs-extra';
import { join } from 'path';
import * as vscode from 'vscode';
import JsonToDart from './converter';
import { snakeCase } from 'lodash';
import { parse } from 'yaml';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jsontodart" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('jsontodart.convertFromClipboard', async () => {
		// The code you place here will be executed every time your command is executed
		const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
		const pubspec = await vscode.workspace.openTextDocument(join(...workspacePath, "pubspec.yaml"));
		const pubspecTree = parse(pubspec.getText());
		console.log(pubspecTree);
		// Display a message box to the user
		const value = await vscode.window.showInputBox({
			placeHolder: "Class Name\n",
		});

		if (!value || value === "") {
			return;
		}

		const typeCheck = pubspecTree?.jsonToDart?.typeChecking ??
			(await vscode.window.showQuickPick(["Yes", "No"], {
				placeHolder: "Need type checking?"
			}) === "Yes");

		const packageAndClass = value?.toString() ?? "";

		const paths = packageAndClass.split(".");
		const className = paths.pop() ?? "";
		let fileName = `${snakeCase(className)}.dart`;

		const filenameHandler = async (): Promise<string> => {
			const confirmFilename =
				await vscode.window.showQuickPick(["Yes", "No"], {
					placeHolder: `Use ${fileName} as file name?`
				});

			if (confirmFilename !== "Yes") {
				const value = await vscode.window.showInputBox({
					placeHolder: "Please input file Name\n"
				});

				if (!value || value.trim() === "") {
					return await filenameHandler();
				} else {
					return value.endsWith(".dart") ? value : value + ".dart";
				}
			}
			return fileName;
		};

		fileName = await filenameHandler();

		try {
			const filePath = join(
				...(workspacePath),
				pubspecTree?.jsonToDart?.outputFolder ?? "lib", ...paths, fileName);
			vscode.window.showInformationMessage(`Writing ${filePath}`);


			const data = await vscode.env.clipboard.readText();
			const obj = JSON.parse(data);
			// vscode.window.showInformationMessage(obj.page);
			console.log(Object.keys(obj));

			const code = new JsonToDart(typeCheck).parse(className, obj).join("\n\n");
			const file = outputFileSync(filePath, code);
			vscode.window.showInformationMessage(`Converting done...`);
		} catch (e) {
			vscode.window.showErrorMessage(e.toString());
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
