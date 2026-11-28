import { createContext, useCallback, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

// Server-side cart. Every mutation returns the full recalculated cart, which replaces the
// cached copy — so line totals, summary and the header badge update instantly.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart'),
    staleTime: 10_000,
  });

  const apply = useCallback((cart) => qc.setQueryData(['cart'], cart), [qc]);
  const onError = (err) => toast.error(err.message);

  const addMut = useMutation({
    mutationFn: ({ productId, variantId, qty }) => api.post('/cart/items', { productId, variantId, qty }),
    onSuccess: apply,
  });
  const updateMut = useMutation({
    mutationFn: ({ productId, variantId, qty }) => api.patch('/cart/items', { productId, variantId, qty }),
    onSuccess: apply,
    onError,
  });
  const removeMut = useMutation({
    mutationFn: ({ productId, variantId }) => api.delete(`/cart/items/${productId}/${variantId}`),
    onSuccess: apply,
    onError,
  });

  const value = useMemo(
    () => ({
      cart: data,
      itemCount: data?.itemCount || 0,
      isLoading,
      isError,
      refetch,
      addItem: addMut.mutateAsync,
      adding: addMut.isPending,
      updateQty: updateMut.mutate,
      removeItem: removeMut.mutate,
      busy: updateMut.isPending || removeMut.isPending,
    }),
    [data, isLoading, isError, refetch, addMut, updateMut, removeMut],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
