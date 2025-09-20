# Schema Framework 文档

这是 Schema 框架的官方文档站点，使用 Jekyll 和 Just the Docs 主题构建。

## 🚀 本地开发

### 环境要求

- Ruby 3.1+
- Bundler
- Jekyll

### 安装和运行

```bash
# 进入文档目录
cd docs

# 安装依赖
bundle install

# 启动本地开发服务器
bundle exec jekyll serve

# 或者启用实时重载
bundle exec jekyll serve --livereload
```

访问 `http://localhost:4000` 查看文档。

## 📁 文档结构

```
docs/
├── _config.yml          # Jekyll 配置文件
├── _sass/
│   └── custom.scss      # 自定义样式
├── Gemfile              # Ruby 依赖
├── index.md             # 首页
├── quick-start.md       # 快速开始
├── concepts.md          # 核心概念
├── api.md               # API 文档
├── examples.md          # 游戏示例
└── faq.md               # 常见问题
```

## 🎨 主题和样式

文档使用 [Just the Docs](https://just-the-docs.github.io/just-the-docs/) 主题，并在 `_sass/custom.scss` 中添加了自定义样式：

- 游戏主题色彩
- 代码块增强
- 响应式设计
- 暗色模式支持

## 📝 内容编写指南

### 页面结构

每个文档页面应包含以下前置信息：

```yaml
---
layout: default
title: 页面标题
nav_order: 数字
description: "页面描述"
---
```

### 代码示例

使用代码示例容器来展示代码：

```html
<div class="code-example">
<h3>示例标题</h3>

```typescript
// 代码内容
```

</div>
```

### 提示框

使用提示框来突出重要信息：

```html
<div class="callout callout-success">
<strong>💡 提示</strong><br>
这里是提示内容
</div>
```

支持的提示框类型：
- `callout` - 默认
- `callout-success` - 成功/绿色
- `callout-warning` - 警告/黄色
- `callout-danger` - 危险/红色

### 徽章

使用徽章来标记特性：

```html
<span class="badge badge-new">新功能</span>
<span class="badge badge-beta">测试版</span>
<span class="badge badge-pro">专业版</span>
```

### 网格布局

使用网格来展示特性卡片：

```html
<div class="grid">
  <div class="grid-item">
    <h3>标题</h3>
    <p>描述</p>
  </div>
  <!-- 更多网格项 -->
</div>
```

## 🔧 自动部署

文档通过 GitHub Actions 自动部署到 GitHub Pages：

- 当 `docs/` 目录中的文件发生变化时触发
- 自动构建 Jekyll 站点
- 部署到 GitHub Pages

## 📚 参考资源

- [Jekyll 文档](https://jekyllrb.com/docs/)
- [Just the Docs 主题](https://just-the-docs.github.io/just-the-docs/)
- [Markdown 语法](https://www.markdownguide.org/)
- [Liquid 模板语言](https://shopify.github.io/liquid/)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 编辑文档文件
4. 本地预览确认
5. 提交 Pull Request

欢迎改进文档内容、修复错误或添加新的示例！ 