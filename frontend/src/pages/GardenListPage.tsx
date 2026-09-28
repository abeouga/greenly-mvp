import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gardenApi } from '../api/gardens';
import { GARDEN_MAX_SIDE, GARDEN_MIN_SIDE, MAX_GARDEN_NAME_LENGTH, isValidGardenSize } from '../domain/limits';
import type { GardenCreateRequest } from '../types/garden';
import { GardenHeader } from '../components/GardenHeader';

export function GardenListPage() {
  const queryClient = useQueryClient();
  const gardens = useQuery({ queryKey: ['gardens'], queryFn: gardenApi.listGardens });
  const [name, setName] = useState('');
  const [width, setWidth] = useState('10');
  const [depth, setDepth] = useState('8');
  const [formError, setFormError] = useState<string | null>(null);
  const createGarden = useMutation({
    mutationFn: (request: GardenCreateRequest) => gardenApi.createGarden(request),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({ queryKey: ['gardens'] });
      window.location.assign(`/gardens/${encodeURIComponent(document.id)}`);
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : '庭を作成できませんでした。'),
  });
  const removeGarden = useMutation({
    mutationFn: gardenApi.deleteGarden,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gardens'] }),
  });

  const widthValue = Number(width);
  const depthValue = Number(depth);
  const validName = name.trim().length > 0 && name.trim().length <= MAX_GARDEN_NAME_LENGTH;
  const validSize = isValidGardenSize(widthValue, depthValue);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validName || !validSize) {
      setFormError(`名前と寸法を確認してください。各辺は${GARDEN_MIN_SIDE}〜${GARDEN_MAX_SIDE}mです。`);
      return;
    }
    createGarden.mutate({ name: name.trim(), width: widthValue, depth: depthValue });
  }

  async function deleteGarden(id: string, gardenName: string) {
    if (!window.confirm(`「${gardenName}」を削除します。元に戻せません。`)) return;
    removeGarden.mutate(id);
  }

  return (
    <div className="page-shell">
      <GardenHeader title="庭の設計を始める" subtitle="庭を作成するか、保存済みの庭を開きます。" />
      <main className="garden-list-layout">
        <section className="panel create-panel" aria-labelledby="create-heading">
          <div className="section-heading">
            <span className="eyebrow">NEW PROJECT</span>
            <h2 id="create-heading">新しい庭</h2>
            <p>庭の寸法は作成後に変更できません。</p>
          </div>
          <form className="create-form" onSubmit={submit}>
            <label className="field-label" htmlFor="garden-name">庭の名前</label>
            <input
              id="garden-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_GARDEN_NAME_LENGTH}
              placeholder="例：南側の庭"
              required
            />
            <div className="dimension-fields">
              <label className="field-label" htmlFor="garden-width">幅 (m)
                <input id="garden-width" type="number" min={GARDEN_MIN_SIDE} max={GARDEN_MAX_SIDE} step="0.1" value={width} onChange={(event) => setWidth(event.target.value)} required />
              </label>
              <label className="field-label" htmlFor="garden-depth">奥行き (m)
                <input id="garden-depth" type="number" min={GARDEN_MIN_SIDE} max={GARDEN_MAX_SIDE} step="0.1" value={depth} onChange={(event) => setDepth(event.target.value)} required />
              </label>
            </div>
            <p className="form-hint">各辺 {GARDEN_MIN_SIDE}〜{GARDEN_MAX_SIDE}m</p>
            {formError && <p className="notice notice-error" role="alert">{formError}</p>}
            {createGarden.isPending && <p className="notice" role="status">庭を作成しています…</p>}
            <button className="button button-primary" type="submit" disabled={createGarden.isPending || !validName || !validSize}>
              庭を作成
            </button>
          </form>
        </section>

        <section className="panel saved-panel" aria-labelledby="saved-heading">
          <div className="section-heading section-heading-inline">
            <div>
              <span className="eyebrow">YOUR GARDENS</span>
              <h2 id="saved-heading">保存した庭</h2>
            </div>
            {gardens.data && <span className="count-tag">{gardens.data.length}件</span>}
          </div>
          {gardens.isLoading && <p className="empty-message" role="status">庭を読み込んでいます…</p>}
          {gardens.isError && (
            <div className="empty-message">
              <p className="notice notice-error" role="alert">庭一覧を取得できませんでした。APIとMySQLの起動状態を確認してください。</p>
              <button className="button button-secondary" onClick={() => gardens.refetch()}>再読み込み</button>
            </div>
          )}
          {gardens.data?.length === 0 && <p className="empty-message">保存した庭はありません。左のフォームから作成してください。</p>}
          {gardens.data && gardens.data.length > 0 && (
            <ul className="garden-cards">
              {gardens.data.map((garden) => (
                <li className="garden-card" key={garden.id}>
                  <button className="garden-card-open" onClick={() => window.location.assign(`/gardens/${encodeURIComponent(garden.id)}`)}>
                    <span className="garden-thumb" aria-hidden="true"><span /></span>
                    <span className="garden-card-copy">
                      <strong>{garden.name}</strong>
                      <span>{garden.width} × {garden.depth} m</span>
                      <span>最終保存 {new Date(garden.updatedAt).toLocaleString('ja-JP')}</span>
                    </span>
                  </button>
                  <button className="icon-button delete-garden" aria-label={`${garden.name}を削除`} disabled={removeGarden.isPending} onClick={() => deleteGarden(garden.id, garden.name)}>削除</button>
                </li>
              ))}
            </ul>
          )}
          {removeGarden.isError && <p className="notice notice-error" role="alert">庭を削除できませんでした。再読み込みして状態を確認してください。</p>}
        </section>
      </main>
      <footer className="page-footer">Greenly · ローカル開発用MVP</footer>
    </div>
  );
}
