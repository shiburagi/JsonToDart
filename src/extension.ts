// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { outputFileSync } from 'fs-extra';
import { join } from 'path';
import * as vscode from 'vscode';
import { snakeCase } from 'lodash';
import { parse } from 'yaml';
import PlainJsonToDart from './engine/converter_podo';
import SerializableJsonToDart from './engine/converter_serializable';


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
	context.subscriptions.push(
		vscode.commands.registerCommand('jsontodart.convertFromClipboardToFile', async (e) => {
			const path = e.path.toString() as string;
			const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
			convertToDart(e.path.substring(0, i), e.path.substring(i));
		}));
}

// this method is called when your extension is deactivated
export function deactivate() { }

class JsonToDartConfig {
	outputFolder: String = "lib";
	typeChecking: Boolean | undefined = undefined;
	nullValueDataType: String = "dynamic";
	nullSafety: Boolean = false;
	copyWithMethod: Boolean = false;
	fromListMethod: Boolean = false;
	mergeArrayApproach: Boolean = true;
	checkNumberAsNum: Boolean = false;
}

async function convertToDart(folder?: string, file?: string) {
	// The code you place here will be executed every time your command is executed
	const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
	const pubspec = await vscode.workspace.openTextDocument(join(...workspacePath, "pubspec.yaml"));
	const pubspecTree = parse(pubspec.getText());

	const jsonToDartConfig = pubspecTree?.jsonToDart ?? {
		outputFolder: "lib"
	};

	const engine = jsonToDartConfig.engine ??
		(await vscode.window.showQuickPick([
			{ label: 'Legacy', description: 'Generate all method/parameter in file', target: "legacy" },
			{ label: 'Json Serializable', description: 'Using packages/json_serializable', target: "json_serializable" },
		], {
			placeHolder: "Need type checking?"
		}))?.target;

	if (!engine) { return; }


	// Display a message box to the user
	const value = await vscode.window.showInputBox({
		placeHolder: file || folder ? "Class Name" : "package.Class Name\n",
	});

	if (!value || value === "") {
		return;
	}
	const typeCheck = jsonToDartConfig.typeChecking ??
		(await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: "Need type checking?"
		}) === "Yes");
	let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
	if (useNum === "ask") {
		useNum = (await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: "Using number(num) checker on int & double value?"
		}) === "Yes");
	}

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
		const filePath = folder ? join(folder.startsWith("/") || folder.startsWith("\\") ? folder.substring(1) : folder, fileName) : join(
			...(workspacePath),
			jsonToDartConfig.outputFolder,
			...paths, fileName);
		vscode.window.showInformationMessage(`Writing ${filePath}`);


		const data = await vscode.env.clipboard.readText();
		const obj = JSON.parse(data);
		const fromListMethod = jsonToDartConfig.fromListMethod ?? true;
		const nullSafety = jsonToDartConfig.nullSafety ?? true;
		const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
		const copyWithMethod = jsonToDartConfig.copyWithMethod ?? false;
		const nullValueDataType = jsonToDartConfig.nullValueDataType;
		const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });

		let engineClass = PlainJsonToDart;
		switch (engine) {
			case "json_serializable":
				engineClass = SerializableJsonToDart;
				break;
			default:
				engineClass = PlainJsonToDart;
		}
		const converter = new engineClass(tabSize, typeCheck, nullValueDataType, nullSafety);
		converter.setIncludeCopyWitMethod(copyWithMethod);
		converter.setIncludeFromListWitMethod(fromListMethod);
		converter.setMergeArrayApproach(mergeArrayApproach);
		converter.setUseNum(useNum);
		converter.setPackage(jsonToDartConfig.package ?? "package:json_annotation/json_annotation.dart");
		const result = converter.parse(className, obj);
		const code = (result[0].imports ? result[0].imports : "") + result.map(r => r.code).join("\n");
		const file = outputFileSync(filePath, code);
		vscode.window.showInformationMessage(`Converting done...`);
	} catch (e) {
		vscode.window.showErrorMessage(`${e}`);
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