// 名称：随机小狗小组件（即时更新版）
// 必须保存为「DogWidget」

const API_URL = 'https://api.thedogapi.com/v1/images/search';
const CACHE_FILE = 'dog_cache_' + Date.now() + '.jpg'; // 动态缓存文件名
const FALLBACK_IMAGE = 'https://cdn2.thedogapi.com/images/0OZkPtVZe.jpg';

const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);

let widget = new ListWidget();

// 智能刷新控制（核心修复）
const forceRefresh = args.queryParameter === 'refresh' || !fm.fileExists(cachePath);

try {
  if (forceRefresh) {
    console.log("🚀 启动强制刷新流程");
    
    // 网络可用性检测
    const hasNetwork = await new Request('https://www.apple.com').load().catch(() => false);
    if (!hasNetwork) {
      widget.addText("🌐 网络不可用").textColor = Color.red();
      Script.complete();
      return;
    }

    // 下载最新图片
    const newImage = await fetchImage();
    fm.writeImage(cachePath, newImage);
    console.log("✅ 新图片已缓存");
  }

  // 显示图片（优先新缓存）
  const img = fm.fileExists(cachePath) 
    ? Image.fromFile(cachePath)
    : await fetchImage();
  
  // 全屏显示关键修改
  widget.backgroundImage = img; // 直接设置为背景图
  widget.setPadding(0, 0, 0, 0); // 移除内边距
  
} catch (error) {
  console.error("❌ 最终错误:", error);
  widget.addText("😿 更新失败").textColor = Color.red();
}

// 点击交互设置
widget.url = `scriptable:///run?scriptName=${encodeURIComponent(module.filename.split('/').pop().replace('.js', ''))}&refresh=true`;
widget.refreshAfterDate = new Date(Date.now() + 3600*1000);
Script.setWidget(widget);
Script.complete();

// 增强版图片获取
async function fetchImage() {
  console.log("🌍 开始获取图片数据");
  const apiReq = new Request(API_URL + '?' + Date.now());
  apiReq.timeoutInterval = 20;
  apiReq.headers = {'Cache-Control': 'no-store'};
  
  try {
    const [data] = await apiReq.loadJSON();
    console.log("🖼️ 图片地址:", data.url);
    
    const imgReq = new Request(data.url);
    imgReq.onRedirect = req => {
      console.log("🔀 重定向至:", req.url);
      return req;
    };
    
    return await imgReq.loadImage();
  } catch (error) {
    console.error("⏬ 下载失败，使用备用图");
    return Image.fromData(await new Request(FALLBACK_IMAGE).load());
  }
}