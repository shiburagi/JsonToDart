# jsontodart 

## How to use

### Method 1
1) Copy JSON
2) Open ```Command Pallete```, and find ```JsonToDart: Convert JSON From Clipboard```
3) Fill the box, select the option
4) Done

### Method 2
1) Copy JSON
2) Right click on folder or dart file
3) Click  ```Convert JSON From Clipboard Here```
4) Fill the box, select the option
6) Done

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

Output:

```dart

class User {
  Data data;
  Support support;

  User({this.data, this.support});

  User.fromJson(Map<String, dynamic> json) {
    this.data = json["data"] == null ? null : Data.fromJson(json["data"]);
    this.support = json["support"] == null ? null : Support.fromJson(json["support"]);
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if(this.data != null)
      data["data"] = this.data.toJson();
    if(this.support != null)
      data["support"] = this.support.toJson();
    return data;
  }
}

class Support {
  String url;
  String text;

  Support({this.url, this.text});

  Support.fromJson(Map<String, dynamic> json) {
    this.url = json["url"];
    this.text = json["text"];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data["url"] = this.url;
    data["text"] = this.text;
    return data;
  }
}

class Data {
  int id;
  String email;
  String firstName;
  String lastName;
  String avatar;

  Data({this.id, this.email, this.firstName, this.lastName, this.avatar});

  Data.fromJson(Map<String, dynamic> json) {
    this.id = json["id"];
    this.email = json["email"];
    this.firstName = json["first_name"];
    this.lastName = json["last_name"];
    this.avatar = json["avatar"];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data["id"] = this.id;
    data["email"] = this.email;
    data["first_name"] = this.firstName;
    data["last_name"] = this.lastName;
    data["avatar"] = this.avatar;
    return data;
  }
}
```

## Customize
```yaml
jsonToDart:
  outputFolder: lib/models #default: lib/
  typeChecking: true  #default: undefined (Select from picker)
```
