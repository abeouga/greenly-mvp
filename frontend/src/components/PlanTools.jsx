import { useState } from "react";
import { Dialog } from "./Dialog";
import { useEditorStore } from "../stores/editorStore";
import { placementRows, shoppingUrl } from "../domain/shopping";
import { captureImage } from "../domain/captureImage";

export function PlanTools({
  document,
  assets,
  disabled,
  photoMode,
  canSave,
  onSave,
  onNavigate,
}) {
  const [open, setOpen] = useState("");
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("");
  const [light, setLight] = useState("日なた");
  const [care, setCare] = useState("少なめ");
  const [purpose, setPurpose] = useState("緑を楽しむ");
  const [suggested, setSuggested] = useState(false);
  const [image, setImage] = useState("");
  const [capturing, setCapturing] = useState(false);
  const rows = placementRows(document, assets);
  function leave(url) {
    const state = useEditorStore.getState();
    if (
      state.isDirty ||
      state.photoBoundaryDraft !== null ||
      state.isCalibrating
    ) {
      setDestination(url);
      return;
    }
    onNavigate(url);
  }
  function shop() {
    setError("");
    try {
      leave(shoppingUrl(rows));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "材料を確認してください。",
      );
    }
  }
  async function saveAndLeave() {
    if (await onSave()) onNavigate(destination);
    else setError("保存できませんでした。編集画面のエラーを確認してください。");
  }
  async function capture() {
    setError("");
    setCapturing(true);
    try {
      const state = useEditorStore.getState();
      const selection = state.selectedObjectId;
      state.selectObject(null);
      try {
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        setImage(await captureImage(document, photoMode));
      } finally {
        useEditorStore.getState().selectObject(selection);
      }
      setOpen("image");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "完成イメージを作成できません。",
      );
    } finally {
      setCapturing(false);
    }
  }
  let plant = "コナラ・ボックスウッド";
  let reason = "日なたで緑を楽しむ庭の候補です。";
  if (light !== "日なた") {
    plant = "アオキ・ヤブラン";
    reason = "半日陰・日陰向けの候補です。";
  }
  if (purpose === "花を楽しむ" && light === "日なた") {
    plant = "ラベンダー・ローズマリー";
    reason = "花と香りを楽しむ候補です。";
  }
  if (care === "少なめ") reason += " 手入れ量を抑える候補を優先しています。";
  return (
    <>
      <div className="plan-actions" role="group" aria-label="庭の計画と購入">
        <button
          onClick={() => {
            setOpen("design");
            setError("");
          }}
          disabled={disabled}
        >
          植物候補を相談
        </button>
        <button onClick={capture} disabled={disabled || capturing}>
          {capturing ? "画像を作成中…" : "完成イメージを確認"}
        </button>
        <button
          className="button button-primary"
          onClick={shop}
          disabled={disabled || rows.length === 0}
        >
          配置したものから商品を探す
        </button>
      </div>
      {error && (
        <p className="notice notice-error plan-feedback" role="alert">
          {error}
        </p>
      )}
      {open === "design" && (
        <Dialog title="条件に合う植物候補" onClose={() => setOpen("")}>
          <form
            className="plan-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSuggested(true);
            }}
          >
            <label>
              日照
              <select
                value={light}
                onChange={(event) => {
                  setLight(event.target.value);
                  setSuggested(false);
                }}
              >
                <option>日なた</option>
                <option>半日陰</option>
                <option>日陰</option>
              </select>
            </label>
            <label>
              手入れ
              <select
                value={care}
                onChange={(event) => {
                  setCare(event.target.value);
                  setSuggested(false);
                }}
              >
                <option>少なめ</option>
                <option>定期的に行う</option>
              </select>
            </label>
            <label>
              用途
              <select
                value={purpose}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  setSuggested(false);
                }}
              >
                <option>緑を楽しむ</option>
                <option>花を楽しむ</option>
              </select>
            </label>
            <button className="button button-primary">候補を確認</button>
          </form>
          {suggested && (
            <section className="plan-suggestion">
              <h3>{plant}</h3>
              <p>{reason}</p>
              <p>配置・購入は利用者が選択します。自動配置は行いません。</p>
            </section>
          )}
        </Dialog>
      )}
      {open === "image" && image && (
        <Dialog title="庭の完成イメージ" onClose={() => setOpen("")}>
          <p>
            現在の写真・3D配置から作成した画像です。植物の成長予測・AI画像生成ではありません。
          </p>
          <img
            className="plan-result-image"
            src={image}
            alt="現在の庭の完成イメージ"
          />
          <a
            className="button button-primary"
            href={image}
            download="kusakari-canvas.png"
          >
            PNGで保存
          </a>
        </Dialog>
      )}
      {destination && (
        <Dialog
          title="変更を保存して進みますか？"
          busy={disabled}
          onClose={() => setDestination("")}
        >
          <p>
            保存せずに進むと未保存の変更が失われます。描画中の輪郭やカメラ設定は確定してから保存してください。
          </p>
          <div className="plan-actions">
            <button onClick={saveAndLeave} disabled={disabled || !canSave}>
              保存して進む
            </button>
            <button onClick={() => onNavigate(destination)} disabled={disabled}>
              保存せず進む
            </button>
            <button onClick={() => setDestination("")} disabled={disabled}>
              取消
            </button>
          </div>
          {error && (
            <p className="notice-error" role="alert">
              {error}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
