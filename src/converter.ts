const camelcase = require('camelcase');

class JsonToDart {
    classNames: Array<String> = [];
    classModels: Array<Result> = [];
    indentText: String;
    shouldCheckType: boolean;
    nullSafety: boolean;
    includeCopyWitMethod: boolean = false;
    mergeArrayApproach: boolean = true;
    nullValueDataType: String;
    handlerSymbol: String;
    constructor(tabSize: number, shouldCheckType?: boolean, nullValueDataType?: String, nullSafety?: boolean) {
        this.indentText = " ".repeat(tabSize);
        this.shouldCheckType = shouldCheckType ?? false;
        this.nullValueDataType = nullValueDataType ?? "dynamic";
        this.nullSafety = nullSafety ?? true;
        this.handlerSymbol = nullSafety ? "?" : "";
    }

    setIncludeCopyWitMethod(b: boolean) {
        this.includeCopyWitMethod = b;
    }
    setMergeArrayApproach(b: boolean) {
        this.mergeArrayApproach = b;
    }


    addClass(className: String, classModel: String) {
        this.classModels.splice(0, 0, {
            code: classModel,
            className: className,
        });
    }

    findDataType(key: String, value: any,): TypeObj {
        let type = "dynamic" as String;
        const typeObj = new TypeObj();
        if (value === null || value === undefined) {
            type = this.nullValueDataType;
            typeObj.isPrimitive = true;
        } else if (Number.isInteger(value)) {
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
    removeNull = (obj: any): any =>
        Object.keys(obj)
            .filter(key => obj[key] !== null)
            .reduce((res, key) => ({ ...res, [key]: obj[key] }), {});

    formatType(type: String, handlerSymbol: String) {
        if (type === "dynamic") { return type; }
        return `${type}${handlerSymbol}`;
    }
    parse(className: String, json: any): Array<Result> {

        className = this.toClassName(className);
        this.classNames.push(className);

        const parameters: Array<String> = [];
        const parametersForMethod: Array<String> = [];
        const fromJsonCode: Array<String> = [];
        const toJsonCode: Array<String> = [];
        const constructorInit: Array<String> = [];
        const copyWithAssign: Array<String> = [];
        if (json) {
            if (Array.isArray(json) && json.length > 0) {
                json = this.mergeArrayApproach ? json.reduce((p, c) => {
                    return {
                        ...p,
                        ...this.removeNull(c),
                    };
                }, {}) : json[0];
            }
            Object.entries(json).forEach(entry => {
                const key = entry[0];
                const value = entry[1];
                const typeObj = this.findDataType(key, value);
                const type = this.formatType(typeObj.type, this.handlerSymbol);
                const paramName = camelcase(key);
                parameters.push(this.toCode(1, type, paramName));
                this.addFromJsonCode(key, typeObj, fromJsonCode);
                this.addToJsonCode(key, typeObj, toJsonCode);
                if (this.includeCopyWitMethod) {
                    parametersForMethod.push(this.toMethodParams(2, type, paramName));
                    copyWithAssign.push(`${this.indent(2)}${paramName}: ${paramName} ?? this.${paramName}`);

                }
                constructorInit.push(`this.${paramName}`);
            });
        }

        const copyWithCode = this.includeCopyWitMethod ?
            `

${this.indent(1)}${className} copyWith({
${parametersForMethod.join("\n")}
${this.indent(1)}}) => ${className}(${copyWithAssign.length ? `{
${copyWithAssign.join(",\n")},
${this.indent(1)}}` : ""});` : '';

        const parametersCode = parameters.length ? `
${parameters.join("\n")}
`: "";
        const code = `
class ${className} {${parametersCode}
${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});

${this.indent(1)}${className}.fromJson(Map<String, dynamic> json) {
${fromJsonCode.join("\n")}
${this.indent(1)}}

${this.indent(1)}Map<String, dynamic> toJson() {
${this.indent(2)}final Map<String, dynamic> data = <String, dynamic>{};
${toJsonCode.join("\n")}
${this.indent(2)}return data;
${this.indent(1)}}${this.includeCopyWitMethod ? copyWithCode : ""}
}`;

        this.addClass(className, code);

        return this.classModels;

    }


    toClassName(name: String): String {
        name = camelcase(name, { pascalCase: true });
        let i = 0;
        let className = name;
        while (this.classNames.includes(className)) {
            ++i;
            className = `${name}${i}`;
        }

        return className;
    }

    r = (type: TypeObj): String => {

        if (type.typeRef !== undefined) {
            return `(e) => e == null?[]:(e as List).map(${this.r(type.typeRef)}).toList()`;
        }
        return `(e) => ${type.type}.fromJson(e)`;
    };


    p = (type: TypeObj): String => {

        if (type.typeRef !== undefined) {
            return `(e) => e?.map(${this.p(type.typeRef)})?.toList() ?? []`;
        }
        return `(e) => e.toJson()`;
    };

    addFromJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        const type = typeObj.type;
        const paramName = `this.${camelcase(key)}`;
        let indentTab = 2;
        if (this.shouldCheckType && type !== "dynamic") {
            indentTab = 3;
            if (typeObj.isObject) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is Map) {`));
            } else if (typeObj.isArray) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is List) {`));
            } else {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is ${type}) {`));
            }
        }
        if (typeObj.isObject) {
            fromJsonCode.push(this.toCode(indentTab,
                paramName, "=", `json["${key}"] == null ? null : ${type}.fromJson(json["${key}"])`));
        }
        else if (typeObj.isArray) {
            if (typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] ?? []`));
            } else if (typeObj.isPrimitive) {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : List<${typeObj.typeRef.type}>.from(json["${key}"])`));
            } else {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : (json["${key}"] as List).map(${this.r(typeObj.typeRef)}).toList()`));
            }
        }
        else {
            fromJsonCode.push(this.toCode(indentTab, paramName, "=", `json["${key}"]`));
        }

        if (indentTab === 3) {
            fromJsonCode.push(this.toCondition(2, `}`));
        }
    }

    addToJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        const paramName = `this.${camelcase(key)}`;
        const paramCode = `data["${key}"]`;
        if (typeObj.isObject) {
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null) {`));
            fromJsonCode.push(this.toCode(3,
                paramCode, "=", `${paramName}${this.handlerSymbol}.toJson()`));
            fromJsonCode.push(this.toCondition(2, `}`));
        }
        else if (typeObj.isArray) {
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null) {`));
            if (typeObj.isPrimitive || typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=", paramName));
            } else {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=",
                    `${paramName}${this.handlerSymbol}.map(${this.p(typeObj.typeRef)}).toList()`));
            }
            fromJsonCode.push(this.toCondition(2, `}`));
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
    toMethodParams(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")},`;
    }

    toCondition(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")}`;
    }
}


class TypeObj {
    type: String = "dynamic";
    defaultValue: String = "''";
    typeRef!: TypeObj;
    isObject: boolean = false;
    isArray: boolean = false;
    isPrimitive: boolean = false;
}

export type Result = {
    code: String;
    className: String;
};



export default JsonToDart;
