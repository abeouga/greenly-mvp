import { useState } from 'react';
import { productImage, yen } from '../api/commerce';
import { ecUrl } from '../domain/shopping';
import { PlacedObjects } from './PlacedObjects';

export function CommercePanel({ document, assets, selectedObject, disabled, commerce, onSelectObject, onNavigate }) {
    const [tab, setTab] = useState('products');
    const { cart, quote, rows, error, notice, busy } = commerce;
    const cartData = cart.data;
    const blocked = disabled || busy || cart.isFetching || cart.isError || !cartData;
    function switchTab(next) {
        setTab(next);
        if (next === 'cart') void cart.refetch();
    }
    function tabKey(event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = tab === 'products' ? 'cart' : 'products';
        let target = next;
        if (event.key === 'Home') target = 'products';
        if (event.key === 'End') target = 'cart';
        switchTab(target);
        event.currentTarget.querySelector(`#commerce-tab-${target}`).focus();
    }
    return <aside id="properties-panel" className="properties-panel commerce-panel" aria-label="商品候補とカート"
      onKeyDown={(event) => event.stopPropagation()}>
      <div className="commerce-tabs" role="tablist" aria-label="商品候補とカートの切替" onKeyDown={tabKey}>
        <button id="commerce-tab-products" type="button" role="tab" aria-selected={tab === 'products'} aria-controls="commerce-products" tabIndex={tab === 'products' ? 0 : -1} onClick={() => switchTab('products')}>商品候補</button>
        <button id="commerce-tab-cart" type="button" role="tab" aria-selected={tab === 'cart'} aria-controls="commerce-cart" tabIndex={tab === 'cart' ? 0 : -1} onClick={() => switchTab('cart')}>カート内容{cartData && `（${cartData.itemCount}）`}</button>
      </div>
      <div className="commerce-scroll">
        {cart.isPending && <p role="status">ECカートを読み込み中…</p>}
        {cart.isError && <div className="notice-error" role="alert"><p>{cart.error.message}</p><button onClick={() => cart.refetch()}>カートを再取得</button></div>}
        {error && <p className="notice-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <section id="commerce-products" role="tabpanel" aria-labelledby="commerce-tab-products" hidden={tab !== 'products'}>
          {quote.isFetching && <p role="status">商品候補を確認中…</p>}
          {quote.isError && <div role="alert" className="notice-error"><p>{quote.error.message}</p><button onClick={() => quote.refetch()}>商品候補を再取得</button></div>}
          {rows.map((row) => {
              const match = quote.data?.find((entry) => entry.materialCode === row.materialCode);
              return <section className="commerce-material" key={row.assetId}>
                <h3>{row.name}<span>配置 {row.quantity}点</span></h3>
                {!row.materialCode && <p>対応する商品がありません。</p>}
                {row.quantity > 99 && <p className="notice-error">商品候補へ渡せる数量は素材ごとに99点までです。</p>}
                {row.quantity <= 99 && match && match.candidates.length === 0 && <p>対応する商品がありません。</p>}
                {row.quantity <= 99 && match?.candidates.map((candidate) => {
                    const line = cartData?.items.find((item) => item.product.id === candidate.product.id);
                    const tooMany = (line?.quantity ?? 0) + candidate.purchaseQuantity > 99;
                    return <article className="commerce-product" key={candidate.product.id} data-testid={`candidate-${candidate.product.id}`}>
                      <img src={productImage(candidate.product.imageUrl)} alt="" loading="lazy"/>
                      <div><strong>{candidate.product.name}</strong><p>{yen(candidate.product.priceYen)} / 点</p>
                        <p>{candidate.purchaseQuantity}点・{yen(candidate.lineTotalYen)}</p><small>店舗在庫 {candidate.product.stock}点</small>
                        {!candidate.available && <p className="notice-error">在庫不足</p>}
                        {tooMany && <p className="notice-error">追加するとカートの上限99点を超えます。</p>}
                        <button type="button" disabled={blocked || quote.isFetching || quote.isError || !candidate.available || tooMany}
                          onClick={() => commerce.add(candidate.product.id, candidate.purchaseQuantity)}>カートに追加</button>
                      </div>
                    </article>;
                })}
              </section>;
          })}
          <PlacedObjects document={document} assets={assets} selectedObject={selectedObject} disabled={disabled} onSelectObject={onSelectObject}/>
        </section>
        <section id="commerce-cart" role="tabpanel" aria-labelledby="commerce-tab-cart" hidden={tab !== 'cart'}>
          {cartData?.items.length === 0 && <p>カートは空です。商品候補から追加してください。</p>}
          {cartData?.items.map((line) => <CartLine key={`${line.product.id}:${line.quantity}`} line={line} disabled={blocked} onQuantity={commerce.setQuantity}/>)}
          {cartData && <div className="commerce-totals"><p>商品小計 <strong>{yen(cartData.subtotalYen)}</strong></p><p>送料 <strong>{yen(cartData.shippingFeeYen)}</strong></p><p>合計 <strong>{yen(cartData.totalYen)}</strong></p>
            <button className="button button-primary" type="button" disabled={blocked || cartData.items.length === 0} onClick={() => onNavigate(new URL('/cart', ecUrl).href)}>注文手続きへ</button>
          </div>}
        </section>
      </div>
    </aside>;
}
function CartLine({ line, disabled, onQuantity }) {
    const [quantity, setQuantity] = useState(String(line.quantity));
    const value = Number(quantity);
    const valid = quantity !== '' && Number.isInteger(value) && value >= 1 && value <= 99;
    return <article className="commerce-product" data-testid={`cart-line-${line.product.id}`}>
      <img src={productImage(line.product.imageUrl)} alt="" loading="lazy"/>
      <div><strong>{line.product.name}</strong><p>{yen(line.product.priceYen)} / 点</p><p>小計 {yen(line.lineTotalYen)}</p>
        {!line.available && <p className="notice-error">在庫不足または販売終了。ECで確認してください。</p>}
        <form onSubmit={(event) => { event.preventDefault(); if (valid && !disabled) onQuantity(line.product.id, value); }}>
          <label>数量<input aria-label={`${line.product.name}のカート数量`} type="number" min="1" max="99" step="1" value={quantity} disabled={disabled} onChange={(event) => setQuantity(event.target.value)}/></label>
          <button disabled={disabled || !valid || value === line.quantity}>更新</button>
        </form>
        <button type="button" disabled={disabled} onClick={() => onQuantity(line.product.id, 0)}>削除</button>
      </div>
    </article>;
}
