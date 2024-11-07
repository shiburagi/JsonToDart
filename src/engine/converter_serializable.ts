import JsonToDart from "./converter";

const camelcase = require('camelcase');

class SerializableJsonToDart extends JsonToDart {
   
    generateClassAnnotation(): String | undefined {
        return "@JsonSerializable()";
    }

    generateFieldAnnotation(key: String, fieldName: String, dataType: String): String | undefined {
        return `@JsonKey(name: '${key}')`;
    }

    generateImport(className:String): String | undefined {
        return `
import '${this.packageImport}';
part '${convert_to_snake_case(className)}.g.dart';
`;
    }

    generateFromJsonCode(className: String, fromJsonCode: Array<String>): String {
        return `
${this.indent(1)}factory ${className}.fromJson(Map<String, dynamic> json) => _$${className}FromJson(json);`;
    }

    generateToJsonCode(className: String, fromJsonCode: Array<String>): String {
        return `
${this.indent(1)}Map<String, dynamic> toJson() => _$${className}ToJson(this);`;
    }
}


const convert_to_snake_case = (string: String) => {
    return string.charAt(0).toLowerCase() + string.slice(1) // lowercase the first character
      .replace(/\W+/g, " ") // Remove all excess white space and replace & , . etc.
      .replace(/([a-z])([A-Z])([a-z])/g, "$1 $2$3") // Put a space at the position of a camelCase -> camel Case
      .split(/\B(?=[A-Z]{2,})/) // Now split the multi-uppercases customerID -> customer,ID
      .join(' ') // And join back with spaces.
      .split(' ') // Split all the spaces again, this time we're fully converted
      .join('_') // And finally snake_case things up
      .toLowerCase(); // With a nice lower case
  };

export default SerializableJsonToDart;
