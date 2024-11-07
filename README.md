# jsontodart 

Demo : https://jsontodart.zariman.dev/

## How to use

### Method 1
1) Copy JSON
2) Open ```Command Pallete```, and find ```JsonToDart: Convert JSON from Clipboard```
3) Fill the box, select the option
4) Done

### Method 2
1) Copy JSON
2) Right click on folder or dart file
3) Click  ```Convert JSON from Clipboard Here```
4) Fill the box, select the option
6) Done

### More Configuration
To handle **null** value on generated model, you can define/change data type on pubspec.yaml

## Sample
```json
{
    "data": {
        "id": 2,
        "email": "janet.weaver@reqres.in",
        "first_name": "Janet",
        "last_name": "Weaver",
        "avatar": "https://reqres.in/img/faces/2-image.jpg"
    },
    "support": {
        "url": "https://reqres.in/#support-heading",
        "text": "To keep ReqRes free, contributions towards server costs are appreciated!"
    }
}
```

### Output:

#### Legacy

config:
```yaml
jsonToDart:
  engine: legacy
  outputFolder: lib/models #default: lib/
  typeChecking: true  #default: undefined (Select from picker)
  nullValueDataType: String #default: dynamic
  nullSafety: false #default: false
  copyWithMethod: true #default: false
  fromListMethod: true #default: false
  mergeArrayApproach: false #default: true
  
   #default: false, 
   #if true, value = (json[key] as num).toInt() or value = (_data[key] as num).toDouble()
   #if false, value = json[key]
   #if "ask", selection popup will apear before parse json
  checkNumberAsNum: true # true, false, "ask"
```

Object:
```dart

class User {
  Data data;
  Support support;

  User({this.data, this.support});

  User.fromJson(Map<String, dynamic> json) {
    if(json["data"] is Map) {
      data = json["data"] == null ? null : Data.fromJson(json["data"]);
    }
    if(json["support"] is Map) {
      support = json["support"] == null ? null : Support.fromJson(json["support"]);
    }
  }

  static List<User> fromList(List<Map<String, dynamic>> list) {
    return list.map(User.fromJson).toList();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> _data = <String, dynamic>{};
    if(data != null) {
      _data["data"] = data.toJson();
    }
    if(support != null) {
      _data["support"] = support.toJson();
    }
    return _data;
  }

  User copyWith({
    Data data,
    Support support,
  }) => User(
    data: data ?? this.data,
    support: support ?? this.support,
  );
}

class Support {
  String url;
  String text;

  Support({this.url, this.text});

  Support.fromJson(Map<String, dynamic> json) {
    if(json["url"] is String) {
      url = json["url"];
    }
    if(json["text"] is String) {
      text = json["text"];
    }
  }

  static List<Support> fromList(List<Map<String, dynamic>> list) {
    return list.map(Support.fromJson).toList();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> _data = <String, dynamic>{};
    _data["url"] = url;
    _data["text"] = text;
    return _data;
  }

  Support copyWith({
    String url,
    String text,
  }) => Support(
    url: url ?? this.url,
    text: text ?? this.text,
  );
}

class Data {
  int id;
  String email;
  String firstName;
  String lastName;
  String avatar;

  Data({this.id, this.email, this.firstName, this.lastName, this.avatar});

  Data.fromJson(Map<String, dynamic> json) {
    if(json["id"] is num) {
      id = (json["id"] as num).toInt();
    }
    if(json["email"] is String) {
      email = json["email"];
    }
    if(json["first_name"] is String) {
      firstName = json["first_name"];
    }
    if(json["last_name"] is String) {
      lastName = json["last_name"];
    }
    if(json["avatar"] is String) {
      avatar = json["avatar"];
    }
  }

  static List<Data> fromList(List<Map<String, dynamic>> list) {
    return list.map(Data.fromJson).toList();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> _data = <String, dynamic>{};
    _data["id"] = id;
    _data["email"] = email;
    _data["first_name"] = firstName;
    _data["last_name"] = lastName;
    _data["avatar"] = avatar;
    return _data;
  }

  Data copyWith({
    int id,
    String email,
    String firstName,
    String lastName,
    String avatar,
  }) => Data(
    id: id ?? this.id,
    email: email ?? this.email,
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    avatar: avatar ?? this.avatar,
  );
}

```

---

#### Json_serializable

config:
```yaml
jsonToDart:
  engine: json_serializable
  outputFolder: lib/models #default: lib/
  typeChecking: true  #default: undefined (Select from picker)
  nullValueDataType: String #default: dynamic
  nullSafety: false #default: false
  copyWithMethod: true #default: false
  fromListMethod: true #default: false
  mergeArrayApproach: false #default: true
  package: package:json_annotation/json_annotation.dart
  
   #default: false, 
   #if true, value = (json[key] as num).toInt() or value = (_data[key] as num).toDouble()
   #if false, value = json[key]
   #if "ask", selection popup will apear before parse json
  checkNumberAsNum: true # true, false, "ask"
```

Object:
```dart

import 'package:json_annotation/json_annotation.dart';
part 'user.g.dart';

@JsonSerializable()
class User {
  @JsonKey(name: 'data')
  Data data;
  @JsonKey(name: 'support')
  Support support;

  User({this.data, this.support});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  static List<User> fromList(List<Map<String, dynamic>> list) {
    return list.map(User.fromJson).toList();
  }

  Map<String, dynamic> toJson() => _$UserToJson(this);

  User copyWith({
    Data data,
    Support support,
  }) => User(
    data: data ?? this.data,
    support: support ?? this.support,
  );
}

@JsonSerializable()
class Support {
  @JsonKey(name: 'url')
  String url;
  @JsonKey(name: 'text')
  String text;

  Support({this.url, this.text});

  factory Support.fromJson(Map<String, dynamic> json) => _$SupportFromJson(json);

  static List<Support> fromList(List<Map<String, dynamic>> list) {
    return list.map(Support.fromJson).toList();
  }

  Map<String, dynamic> toJson() => _$SupportToJson(this);

  Support copyWith({
    String url,
    String text,
  }) => Support(
    url: url ?? this.url,
    text: text ?? this.text,
  );
}

@JsonSerializable()
class Data {
  @JsonKey(name: 'id')
  int id;
  @JsonKey(name: 'email')
  String email;
  @JsonKey(name: 'first_name')
  String firstName;
  @JsonKey(name: 'last_name')
  String lastName;
  @JsonKey(name: 'avatar')
  String avatar;

  Data({this.id, this.email, this.firstName, this.lastName, this.avatar});

  factory Data.fromJson(Map<String, dynamic> json) => _$DataFromJson(json);

  static List<Data> fromList(List<Map<String, dynamic>> list) {
    return list.map(Data.fromJson).toList();
  }

  Map<String, dynamic> toJson() => _$DataToJson(this);

  Data copyWith({
    int id,
    String email,
    String firstName,
    String lastName,
    String avatar,
  }) => Data(
    id: id ?? this.id,
    email: email ?? this.email,
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    avatar: avatar ?? this.avatar,
  );
}
```

## Customize (pubspec.yaml)
```yaml
jsonToDart:
  engine: json_serializable # json_serializable or legacy
  outputFolder: lib/models #default: lib/
  typeChecking: true  #default: undefined (Select from picker)
  nullValueDataType: String #default: dynamic
  nullSafety: false #default: true
  copyWithMethod: true #default: false
  fromListMethod: true #default: false
  mergeArrayApproach: false #default: true
  package: package:freezed_annotation/freezed_annotation.dart # default: package:json_annotation/json_annotation.dart
  
   #default: false, 
   #if true, value = (json[key] as num).toInt() or value = (_data[key] as num).toDouble()
   #if false, value = json[key]
   #if "ask", selection popup will apear before parse json
  checkNumberAsNum: true # true, false, "ask"
```
