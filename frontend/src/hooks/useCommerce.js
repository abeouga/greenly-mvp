import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commerceApi, CommerceError } from '../api/commerce';
import { ecUrl, placementRows } from '../domain/shopping';

const cartKey = ['ec-cart', ecUrl];
export function useEcCart() {
    return useQuery({ queryKey: cartKey, queryFn: commerceApi.cart, retry: false,
        staleTime: 10000, refetchOnWindowFocus: true });
}
export function useCommerce(document, assets) {
    const client = useQueryClient();
    const cart = useEcCart();
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const locked = useRef(false);
    const rows = document ? placementRows(document, assets) : [];
    const items = rows.filter((row) => row.materialCode && row.quantity <= 99)
        .map((row) => ({ materialCode: row.materialCode, quantity: row.quantity, unit: row.unit }))
        .sort((a, b) => a.materialCode.localeCompare(b.materialCode));
    const quote = useQuery({
        queryKey: ['ec-quote', ecUrl, cart.data?.storeId, items],
        queryFn: () => commerceApi.quote(cart.data.storeId, items),
        enabled: !!cart.data && !cart.isError && items.length > 0 && items.length <= 50,
        retry: false, staleTime: 30000, refetchOnWindowFocus: true,
    });
    const mutation = useMutation({
        mutationFn: ({ id, quantity, revision }) => commerceApi.setItem(id, quantity, revision),
        retry: false,
    });
    async function change(id, quantity, add = false) {
        if (locked.current) return;
        locked.current = true;
        setError('');
        setNotice('');
        try {
            await client.cancelQueries({ queryKey: cartKey });
            const current = client.getQueryData(cartKey);
            if (!current) throw new Error('カートを再取得してください。');
            let next = quantity;
            if (add) {
                const line = current.items.find((item) => item.product.id === id);
                if (line) next += line.quantity;
            }
            if (!Number.isInteger(next) || next < 0 || next > 99) throw new Error('カートの商品数量は0〜99点で指定してください。');
            const saved = await mutation.mutateAsync({ id, quantity: next, revision: current.revision });
            client.setQueryData(cartKey, saved);
            setNotice(next === 0 ? 'カートから削除しました。' : 'カートを更新しました。');
        } catch (reason) {
            if (reason instanceof CommerceError) {
                await cart.refetch();
                setError(`${reason.message} 最新のカート内容を確認してから操作してください。`);
            } else setError(reason.message);
        } finally { locked.current = false; }
    }
    return { cart, quote, rows, notice, error, busy: mutation.isPending,
        add: (id, quantity) => change(id, quantity, true),
        setQuantity: (id, quantity) => change(id, quantity) };
}
