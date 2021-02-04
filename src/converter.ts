import * as vscode from 'vscode';

const camelcase = require('camelcase');

class JsonToDart {
    classNames: Array<String> = new Array();
    classModels: Array<String> = new Array();
    indentText: String;
    shouldCheckType: boolean;
    constructor(shouldCheckType?: boolean) {

        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        this.indentText = " ".repeat(tabSize);
        this.shouldCheckType = shouldCheckType ?? false;
    }

    addClass(className: String, classModel: String) {
        this.classNames.push(className);
        this.classModels.splice(0, 0, classModel);
    }

    findDataType(key: String, value: any,): TypeObj {
        let type = "dynamic" as String;
        const typeObj = new TypeObj();

        if (Number.isInteger(value)) {
            type = "int";
            typeObj.isPrimitive = true;
        } else if ((typeof value) === "number") {
            type = "double";
            typeObj.isPrimitive = true;
        } else if ((typeof value) === "string") {
            type = "String";
            typeObj.isPrimitive = true;
        } else if ((typeof value) === "boolean") {
            type = "bool";
            typeObj.isPrimitive = true;
        }
        else if (value instanceof Array) {
            const temp = value as Array<any>;
            typeObj.isArray = true;
            if (temp.length === 0) {
                type = "List<dynamic>";
            } else {
                const _type = this.findDataType(key, temp[0]);
                typeObj.typeRef = _type;
                typeObj.isPrimitive = _type.isPrimitive;
                type = `List<${_type.type}>`;
            }
        } else if ((typeof value) === "object") {
            typeObj.isObject = true;
            type = this.toClassName(key);
            this.parse(type, value);
        }
        typeObj.type = type;
        return typeObj;
    }


    parse(className: String, json: any): Array<String> {

        className = this.toClassName(className);
        const parameters = new Array();
        const fromJsonCode = new Array();
        const toJsonCode = new Array();
        const constructorInit = new Array();
        if (json) {
            Object.entries(json).forEach(entry => {
                const key = entry[0];
                const value = entry[1];
                const typeObj = this.findDataType(key, value);
                const type = typeObj.type;
                const paramName = camelcase(key);
                parameters.push(this.toCode(1, type, paramName));
                this.addFromJsonCode(key, typeObj, fromJsonCode);
                this.addToJsonCode(key, typeObj, toJsonCode);
                constructorInit.push(`this.${paramName}`);
            });
        }

        const code = `
class ${className} {
${parameters.join("\n")}

${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});

${this.indent(1)}${className}.fromJson(Map<String, dynamic> json) {
${fromJsonCode.join("\n")}
${this.indent(1)}}

${this.indent(1)}Map<String, dynamic> toJson() {
${this.indent(2)}final Map<String, dynamic> data = new Map<String, dynamic>();
${toJsonCode.join("\n")}
${this.indent(2)}return data;
${this.indent(1)}}
}`;

        this.addClass(className, code);

        return this.classModels;

    }


    toClassName(name: String): String {
        name = camelcase(name, { pascalCase: true });
        let i;
        while (this.classNames.includes(name + (i?.toString() ?? ""))) {
            i = (i ?? 1) + 1;
        }
        return name;
    }

    r = (type: TypeObj): String => {

        if (type.typeRef !== undefined) {
            return `(e)=>e==null?[]:(e as List).map(${this.r(type.typeRef)}).toList()`;
        }
        return `(e)=>${type.type}.fromJson(e)`;
    };


    p = (type: TypeObj): String => {

        if (type.typeRef !== undefined) {
            return `(e)=>e?.map(${this.p(type.typeRef)})?.toList() ?? []`;
        }
        return `(e)=>e.toJson()`;
    };

    addFromJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        const type = typeObj.type;
        const paramName = `this.${camelcase(key)}`;
        let indentTab = 2;
        if (this.shouldCheckType) {
            indentTab = 3;
            if (typeObj.isObject) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is Map)`));
            } else if (typeObj.isArray) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is List)`));
            } else {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is ${type})`));
            }
        }
        if (typeObj.isObject) {
            fromJsonCode.push(this.toCode(indentTab,
                paramName, "=", `json["${key}"] == null ? null : ${type}.fromJson(json["${key}"])`));
        }
        else if (typeObj.isArray) {
            if (typeObj.isPrimitive || typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"]?.cast<${type}>() ?? []`));
            } else {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"]==null?[]:(json["${key}"] as List).map(${this.r(typeObj.typeRef)}).toList()`));
            }
        }
        else {
            fromJsonCode.push(this.toCode(indentTab, paramName, "=", `json["${key}"]`));
        }
    }

    addToJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        const type = typeObj.type;
        const paramName = `this.${camelcase(key)}`;
        const paramCode = `data["${key}"]`;
        if (typeObj.isObject) {
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null)`));
            fromJsonCode.push(this.toCode(3,
                paramCode, "=", `${paramName}.toJson()`));
        }
        else if (typeObj.isArray) {
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null)`));
            if (typeObj.isPrimitive || typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=", paramName));
            } else {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=", `${paramName}.map(${this.p(typeObj.typeRef)}).toList()`));
            }
        }
        else {
            fromJsonCode.push(this.toCode(2,
                paramCode, "=", paramName));
        }
    }


    indent(count: number): String {
        return this.indentText.repeat(count);
    }

    toCode(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")};`;
    }

    toCondition(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")}`;
    }
}


class TypeObj {
    type: String = "dynamic";
    typeRef!: TypeObj;
    isObject: boolean = false;
    isArray: boolean = false;
    isPrimitive: boolean = false;

}



export default JsonToDart;