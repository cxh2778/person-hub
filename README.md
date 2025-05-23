# 交互式3D太阳系模拟

这是一个使用Three.js构建的交互式、视觉逼真的3D太阳系场景。

## 特色功能

- 未来感暗色主题，营造沉浸式太空氛围
- 写实的行星贴图，视觉上尺寸合理
- 行星自转和公转动画
- 点击任意行星，摄像机会平滑飞行至该行星附近
- 悬浮信息面板，展示行星的详细数据
- 响应式设计，支持桌面端和移动端

## 使用方法

1. 克隆本仓库到本地
2. 将贴图文件放置在 `/textures` 目录下
3. 使用Web服务器部署项目或直接打开`index.html`文件
4. 在浏览器中浏览太阳系

## 贴图资源

项目需要以下贴图文件:

- sun.jpg - 太阳贴图
- mercury.jpg - 水星贴图
- venus.jpg - 金星贴图
- earth.jpg - 地球贴图
- moon.jpg - 月球贴图
- mars.jpg - 火星贴图
- jupiter.jpg - 木星贴图
- saturn.jpg - 土星贴图
- saturn_rings.png - 土星环贴图
- uranus.jpg - 天王星贴图
- neptune.jpg - 海王星贴图

您可以从NASA的公开图像库或其他资源网站获取这些行星贴图。

## 交互控制

- 点击任意行星：聚焦并显示该行星信息
- 鼠标拖拽：旋转视角
- 鼠标滚轮：缩放视图
- 点击"返回"按钮：返回太阳系俯视图

## 技术实现

- 使用Three.js和WebGLRenderer渲染
- 使用OrbitControls实现相机控制
- 通过Raycaster实现行星选择
- 使用TWEEN.js实现平滑相机过渡
- CSS2DRenderer实现行星标签

## 优化方案

- 使用低面模型+高清贴图提高性能
- 异步加载贴图资源
- 使用加载进度条提升用户体验 