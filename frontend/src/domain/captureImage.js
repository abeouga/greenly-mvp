function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = source;
  });
}

export async function captureImage(garden, photoMode) {
  const view = document.querySelector(".canvas-column");
  const rendering = view?.querySelector("canvas");
  if (!rendering || rendering.width === 0 || rendering.height === 0)
    throw new Error("3D表示の読み込み完了後に実行してください。");
  window.dispatchEvent(new Event("kusakari-canvas-capture"));
  const renderUrl = rendering.toDataURL("image/png");
  const output = document.createElement("canvas");
  const context = output.getContext("2d");
  if (!context) throw new Error("画像を作成できません。");
  if (photoMode && garden.photo) {
    output.width = garden.photo.imageWidth;
    output.height = garden.photo.imageHeight;
    const photo = await loadImage(garden.photo.dataUrl);
    context.drawImage(photo, 0, 0, output.width, output.height);
  } else {
    output.width = rendering.width;
    output.height = rendering.height;
  }
  const model = await loadImage(renderUrl);
  context.drawImage(model, 0, 0, output.width, output.height);
  return output.toDataURL("image/png");
}
