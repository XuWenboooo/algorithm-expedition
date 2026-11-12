# 算法远征 · Algorithm Expedition

在线使用：https://xuwenboooo.github.io/algorithm-expedition/

中文交互式算法学习网站：20 门 READY 课程，24 门仅规划课程。从 C++ 起步到算法与团队训练。无需账号、付费 API、后端或运行时 CDN。

本项目是训练工具，不保证竞赛成绩。未实现运行用户 C++ 代码的在线判题。

## 学习路线与题单

新增 8 站学习路线与 23 道洛谷/牛客题目，含知识点关联、练习目标和原创提示。题单支持搜索与平台/站次/课程/状态筛选；通过状态和一句复盘由学习者手动记录，纳入 JSON 备份。

- 学习路线：https://xuwenboooo.github.io/algorithm-expedition/#/roadmap
- 题单实战：https://xuwenboooo.github.io/algorithm-expedition/#/problems
- 题面和评测在官方平台，本站不自动同步 AC。路线站次不代表官方难度。
- 尚未完成课程明确标注规划，远期题目不等于本站已具备完整教学。
- 来源、范围及维护说明见 docs/learning-route.md。

## 本地开发

需要 Node.js 22 或更新版本。

```sh
npm ci
npm run dev
```

生产预览：`npm run build` 后执行 `npm run preview`，打开 http://127.0.0.1:4173 。不能直接双击 dist/index.html。

## 测试

```sh
npm test
npm run build
```

`npm test` 先从源码构建 19 个 C++17 参考程序，再执行 162 项测试（含 18 项 C++ 对拍）。编译器或参考程序缺失会失败，不会伪报全部通过。Linux 使用 g++；Windows 自动发现已安装的 Visual Studio C++ 工具，也可设置 `CXX` 指向 g++。运行网站本身不需要 C++ 编译器。

## GitHub Pages 发布

1. 在 GitHub 账号下建立公开仓库 `algorithm-expedition`。
2. 将此目录中的源码提交到 `main`。不要提交 node_modules、dist、环境变量或 C++ 编译产物。
3. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
4. Actions 中的 **Test and deploy GitHub Pages** 会测试、构建并部署。若源码在启用 Pages 之前已推送，可点 Run workflow 重跑。

成功后，以部署任务显示的公开 URL 为准。相对资源路径与 hash 路由支持项目子路径和课程刷新。

以后修改源码并推送到 main，测试通过后会自动更新网站。可通过撤销某次提交并推送来回退版本。网站使用 GitHub Pages 托管，不依赖本地电脑持续开机，但仍受 GitHub 服务和账号状态影响。

## 学习记录与备份

学习进度、笔记和错题仅保存在当前浏览器的 localStorage，不会发送到 GitHub，也不会跨设备同步。

从旧本地地址迁移时：先在旧网站的「训练记录」导出 JSON，再在公开网站导入。不同域名、浏览器和设备的记录独立；清除网站数据会丢失记录，请定期导出。公开仓库和发布包不含个人学习备份。

## 目录

- src/：课程、轨迹算法、界面及本地进度存储
- tests/：算法、练习及 C++ 对拍测试
- scripts/cpp/：C++17 参考源码（不含二进制）
- .github/workflows/deploy-pages.yml：测试、构建、发布
- public/THIRD_PARTY_NOTICES.txt：随站点分发的依赖许可证
- docs/deployment.md：维护与验证说明

尚未为项目原创内容授予开源许可证；公开可见不等于允许任意复制或再许可。第三方依赖按各自许可证使用。
