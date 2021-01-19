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

	context.subscriptions.push(
		vscode.commands.registerCommand('jsontodart.convertFromClipboard', async () => {
			convertToDart();
		}));
	context.subscriptions.push(
		vscode.commands.registerCommand('jsontodart.convertFromClipboardToFolder', async (e) => {
			convertToDart(e.path);
		}));
	context.subscriptions.push
		(vscode.commands.registerCommand('jsontodart.convertFromClipboardToFile', async (e) => {
			const path = e.path.toString() as string;
			const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
			convertToDart(e.path.substring(0, i), e.path.substring(i));
		}));
}

// this method is called when your extension is deactivated
export function deactivate() { }


async function convertToDart(folder?: string, file?: string) {
	// The code you place here will be executed every time your command is executed
	const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
	const pubspec = await vscode.workspace.openTextDocument(join(...workspacePath, "pubspec.yaml"));
	const pubspecTree = parse(pubspec.getText());
	// Display a message box to the user
	const value = await vscode.window.showInputBox({
		placeHolder: file || folder ? "Class Name" : "package.Class Name\n",
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
	let fileName: string;
	if (file) {
		fileName = file;
	} else {
		fileName = await filenameHandler(`${snakeCase(className)}.dart`);
	}
	try {
		const filePath = folder ? join(folder, fileName) : join(
			...(workspacePath),
			pubspecTree?.jsonToDart?.outputFolder ?? "lib",
			...paths, fileName);
		vscode.window.showInformationMessage(`Writing ${filePath}`);


		const data = await vscode.env.clipboard.readText();
		const obj = JSON.parse(data);

		const code = new JsonToDart(typeCheck).parse(className, obj).join("\n");
		const file = outputFileSync(filePath, code);
		vscode.window.showInformationMessage(`Converting done...`);
	} catch (e) {
		vscode.window.showErrorMessage(e.toString());
		console.log(e);
	}
}

const filenameHandler = async (fileName: string): Promise<string> => {
	const confirmFilename =
		await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: `Use ${fileName} as file name?`
		});

	if (confirmFilename !== "Yes") {
		const value = await vscode.window.showInputBox({
			placeHolder: "Please input file Name\n"
		});

		if (!value || value.trim() === "") {
			return await filenameHandler(fileName);
		} else {
			return value.endsWith(".dart") ? value : value + ".dart";
		}
	}
	return fileName;
};