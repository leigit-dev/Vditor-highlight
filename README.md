# Vditor SV Highlight（非官方插件）

为旧版 Vditor 的 **SV（分屏预览）模式** 补上 Markdown 语法高亮。

不修改 Vditor 源码，独立文件引入，一行代码启用。


## 背景

Vditor 是一款优秀的 Markdown 编辑器，但在部分旧版本（如 `v4.0.0`）中，**SV 模式的左侧编辑区仅使用原生 `<textarea>`，不支持 Markdown 语法高亮**——所有文字都是同一个颜色，写代码块、标题、引用时阅读体验较差。

**Vditor SV Highlight** 通过一层轻量的“背景遮罩”方案，为 SV 模式的编辑区补上语法高亮，让标题、粗体、斜体、代码块、引用、列表等 Markdown 元素用不同颜色区分，同时**不改变字号与排版**，保持纯文本编辑手感。


## 特性

- **语法高亮**：标题、粗体、斜体、删除线、链接、列表、引用、代码块、行内代码、分割线
- **零侵入**：不修改 Vditor 的 `index.js` / `index.css`，升级 Vditor 不受影响
- **模式切换自动处理**：切到 `ir` / `wysiwyg` 时自动清理高亮层，切回 `sv` 时自动重建
- **光标对齐**：通过强制统一 `font-family` / `font-size` / `line-height` / `padding`，保证光标位置与高亮文字完全重合
- **可自定义颜色**：只需修改 CSS 里的一小段 `.token-*` 颜色
- **极简接入**：引入 2 个文件 + 调用 1 个函数



## 效果展示
- **启用高亮前**

<img width="844" height="462" alt="无标题2" src="https://github.com/user-attachments/assets/1aa39671-c0bb-4e5d-8388-0d1998b2edab" />

---

- **启用高亮后**
<img width="841" height="456" alt="无标题" src="https://github.com/user-attachments/assets/19ecb0b2-8612-4d9f-87d8-d3e7cebd68d9" />

## 快速开始

### 1. 放置文件

将以下两个文件放到你的静态资源目录（示例为 `static/vditor-highlight/`）：

```
your-project/
└── static/
    └── vditor-highlight/
        ├── vditor-hl.css
        └── vditor-hl.js
```

### 2. 引入资源

在你的 HTML 页面中，按顺序引入：

```html
<!-- 1. Vditor 核心样式 -->
<link rel="stylesheet" href="/static/vditor/dist/index.css">

<!-- 2. 本插件样式（必须在 Vditor 核心 CSS 之后） -->
<link rel="stylesheet" href="/static/vditor-highlight/vditor-hl.css">

<!-- 3. Vditor 核心脚本 -->
<script src="/static/vditor/dist/index.min.js"></script>

<!-- 4. 本插件脚本（必须在 Vditor 核心 JS 之后） -->
<script src="/static/vditor-highlight/vditor-hl.js"></script>
```

### 3. 初始化并启用

```html
<div id="vditor-editor"></div>

<script>
  var vditor = new Vditor('vditor-editor', {
    mode: 'sv',                 // 必须使用 sv 模式
    preview: { mode: 'both' },  // 分屏预览

    after: function () {
      // ✅ 一行启用语法高亮
      enableVditorSVHighlight(vditor, { autoRefresh: 500 });
    }
  });
</script>
```


## API

### `enableVditorSVHighlight(vditor, options?)`

启用 SV 模式语法高亮。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `vditor` | `Vditor` | Vditor 实例（必传） |
| `options.autoRefresh` | `number` | 自动刷新间隔（毫秒）。默认 `0`（关闭）。建议 `500`。用于同步 `setValue` / `undo` / `redo` / 上传图片等不触发 `input` 事件的场景。 |

**示例：**

```js
// 基础用法：依赖 input 事件，适合纯打字场景
enableVditorSVHighlight(vditor);

// 推荐用法：开启自动刷新，覆盖所有内容变更场景
enableVditorSVHighlight(vditor, { autoRefresh: 500 });
```


### `refreshVditorSVHighlight()`

手动刷新一次高亮。

当你关闭了 `autoRefresh`，但又在某些操作（`setValue`、`undo`、`redo`、上传图片等）后需要立即同步时，可以调用它。

```js
vditor.setValue('# 新标题\n\n新内容');
refreshVditorSVHighlight();
```


## 自定义高亮颜色

打开 `vditor-hl.css`，找到底部的颜色定义，按需修改：

```css
/* 5. 自定义词法颜色 */
.token-heading       { color: #FE7901; }  /* 标题 */
.token-bold          { color: #B435D9; }  /* 粗体 */
.token-italic        { color: #F4C627; }  /* 斜体 */
.token-strike        { color: #d73a49; text-decoration: line-through; }  /* 删除线 */
.token-code-block    { color: #0453FA; }  /* 多行代码块 */
.token-code-inline   { color: #0453FA; }  /* 行内代码 */
.token-link          { color: #032f62; text-decoration: underline; }    /* 链接 */
.token-list          { color: #005cc5; }  /* 列表 */
.token-quote         { color: #3399CC; }  /* 引用 */
.token-hr            { color: #6a737d; }  /* 分割线 */
```

同时支持 Vditor 的深色模式（`.vditor--dark`），无需额外配置。


## 兼容性

| 项目 | 说明 |
| --- | --- |
| Vditor 版本 | **仅在 Vditor 4.0.0 上测试通过**。其他版本由于 DOM 结构或样式差异，可能需要微调 CSS 才能完美对齐。 |
| 浏览器 | Chrome / Edge / Firefox / Safari 现代版本 |
| 依赖 | 无（不需要额外的 Markdown 解析库） |
| 工作模式 | 仅作用于 `mode: 'sv'`；切换到 `ir` / `wysiwyg` 时自动清理 |


## 注意事项

1. **必须使用 `mode: 'sv'`**：本插件是为 SV 模式设计的，其他模式不生效。
2. **加载顺序不可颠倒**：自定义 CSS 必须在 Vditor 核心 CSS 之后，自定义 JS 必须在 Vditor 核心 JS 之后。
3. **不要修改 `font-family` / `font-size` / `line-height` 中的任意一项**：这三项在 `textarea` 与高亮层 `pre` 中必须完全一致，否则光标会与文字错位。若需更换字体，请同时修改两处。
4. **本插件不改变字号与排版**：仅进行颜色区分，不放大标题、不改变代码块字号，保持 SV 模式纯文本编辑手感。
5. **升级 Vditor 无需重新配置**：升级时只替换 `vditor/dist/` 内的文件即可，本插件的两个文件保持不动。
6. **其他 Vditor 版本可能需要微调**：本插件仅在 Vditor 4.0.0 上验证。若你使用的是其他版本，请检查开发者工具中 `.vditor-sv` 与 `.vditor-sv-highlight` 的排版参数是否一致，必要时微调 CSS 中的 `padding`、`line-height`、`font-family` 等。


## 版权与致谢

本插件（Vditor SV Highlight）为独立实现，不包含 Vditor 源码，仅通过 DOM 层叠加为 Vditor 的 SV 模式提供语法高亮。

- 本插件版权归插件作者所有，采用 MIT License。
- Vditor 是第三方项目，版权归 B3log 开源（b3log.org），采用 MIT License。
- Vditor 项目地址：https://github.com/Vanessa219/vditor

本插件为非官方插件，与 Vditor 官方无关联。Vditor 名称及相关权利归其所有者。

### 第三方依赖许可：Vditor


```text
Vditor - A markdown editor written in TypeScript.

MIT License

Copyright (c) 2019-present B3log 开源, b3log.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

使用本插件请遵守本项目的 MIT License；使用 Vditor 请遵守 Vditor 的 MIT License。

## License

本插件采用 MIT License，详见 [LICENSE](./LICENSE)。
