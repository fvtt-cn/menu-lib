# menu-lib
提供之前warpgate模组提供的menu和buttonDialog的简单交互界面函数。
提供之前ase中的魔法飞弹选择类似的选择token功能（见下图1）。
提供自制的复杂选择界面，可以根据总点数池和每个选项消耗的点数及可选择次数进行选择并返回结果。
此外还提供了一些其他的简单api。

## 使用效果
![image](https://github.com/fvtt-cn/menu-lib/assets/46736326/fa95c2f4-598b-483c-a3df-14faebfa9e98)
![image](https://github.com/fvtt-cn/menu-lib/assets/46736326/df50ffc4-7438-4005-a150-e75ff51ba304)

## API 应用程序编程接口
使用范例：
```
let result = await menulib.buttonDialog({ buttons: buttons, title: option.title ?? "选择", content: option.info ?? "请选择选项" });
```
详细参数参见api.js文件中的各个函数注释。
