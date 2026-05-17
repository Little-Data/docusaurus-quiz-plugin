# 在 Docusaurus 页面中添加测验！

<img width="1002" height="966" alt="屏幕截图 2026-05-17 222202" src="https://github.com/user-attachments/assets/af6b30f6-ebac-4afc-81c4-fe02accfd61b" />

# 看看效果
[在 Docusaurus 页面中添加测验](https://little-data.eu.org/add_the_exam_in_docusaurus)

# 快速添加

1. 将仓库下载下来：`Code` → `Download zip`
2. 在你项目的根目录中新建文件夹`plugins`
3. 进入`plugins`文件夹，新建`quiz-plugin`文件夹
4. 打开下载好的压缩包，进入`docusaurus-quiz-plugin-main`文件夹中
5. 将里面的所有文件解压到`quiz-plugin`文件夹中
6. 修改`docusaurus.config.js`文件：

```JS
i18n: {
  defaultLocale: 'zh-Hans',
  locales: ['zh-Hans'],
},
plugins: [
  'docusaurus-plugin-zooming',
  './plugins/quiz-plugin',    // 仅需添加此行，其余不变
],
```

# 使用

支持单选，多选，填空。填空无法自动判断对错。所有数据处理均在本地完成。

## 单选
```html
<Workpaper>
  <Workitem xuanze>
    <Wenben>下列哪项是 React 的核心概念？</Wenben>
    <Xuanxiang label="项">双向数据绑定</Xuanxiang>
    <Xuanxiang ans>组件化</Xuanxiang>
    <Xuanxiang>模板引擎</Xuanxiang>
    <Xuanxiang>依赖注入</Xuanxiang>
    <Jiexi>React 采用组件化的方式来构建用户界面。</Jiexi>
  </Workitem>
</Workpaper>
```

## 多选
```html
<Workpaper>
  <Workitem xuanze>
    <Wenben>以下哪些属于 React Hooks？</Wenben>
    <Xuanxiang ans>useState</Xuanxiang>
    <Xuanxiang ans>useEffect</Xuanxiang>
    <Xuanxiang>useSelector</Xuanxiang>
    <Xuanxiang ans>useContext</Xuanxiang>
    <Jiexi>useState、useEffect、useContext 都是内置 Hooks，useSelector 来自 Redux。</Jiexi>
  </Workitem>
</Workpaper>
```

`label`是控制选择的序号，默认A,B,C,D这些序号，带`ans`为该选项为正确答案。

## 填空
```html
<Workpaper>
  <Workitem tiankong>
    <Wenben>请简述 React 中状态提升的概念。</Wenben>
    <Ansinput />
    <Jiexi>状态提升是指将多个组件共享的状态提升到它们最近的公共父组件中。</Jiexi>
  </Workitem>
</Workpaper>
```

## 答题设置

只需在`<Workpaper>`中添加`<Workpapersettings />`即可设置是否直接显示答案/解析，默认不直接显示。可以直接指定设置：

```html
<Workpaper>
<Workpapersettings showans="true" showjiexi="true" />
  <Workitem xuanze>
    <Wenben>React 使用哪种语法来描述界面？</Wenben>
    <Xuanxiang>HTML</Xuanxiang>
    <Xuanxiang ans>JSX</Xuanxiang>
    <Xuanxiang>XML</Xuanxiang>
    <Xuanxiang>YAML</Xuanxiang>
    <Jiexi>JSX 是 JavaScript 的语法扩展，用于描述 UI 结构。</Jiexi>
  </Workitem>
  <Workitem tiankong>
    <Wenben>React 中用于管理复杂状态逻辑的 Hook 是？</Wenben>
    <Ansinput />
    <Jiexi>useReducer 是 useState 的替代方案，适用于复杂状态逻辑。</Jiexi>
  </Workitem>
</Workpaper>
```
在`<Workpaper>`中可以同时有单选，多选，填空。
