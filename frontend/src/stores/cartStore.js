import { create } from 'zustand';
import api from '../services/api';

export const useCartStore = create((set, get) => ({
    items: [],
    customerId: null,
    total: 0,

    addItem: (product, quantity = 1, unitPrice = null, unitId = null, isOpenBox = false, returnedItemId = null) => {
        const existing = get().items.find(i => i.product_id === product.id && i.unit_id === unitId && i.is_open_box === isOpenBox && i.returned_item_id === returnedItemId);
        let newItems;
        if (existing) {
            newItems = get().items.map(i =>
                i.product_id === product.id && i.unit_id === unitId && i.is_open_box === isOpenBox && i.returned_item_id === returnedItemId
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
            );
        } else {
            newItems = [...get().items, {
                product_id: product.id,
                name: product.name,
                price: unitPrice !== null ? unitPrice : product.base_price,
                quantity: quantity,
                unit_id: unitId,
                is_open_box: isOpenBox,
                returned_item_id: returnedItemId
            }];
        }
        set({ items: newItems });
        get().calculateCart();
    },

    removeItem: (index) => {
        const newItems = get().items.filter((_, i) => i !== index);
        set({ items: newItems });
        get().calculateCart();
    },

    updateQuantity: (index, quantity) => {
        if (quantity < 1) return;
        const items = [...get().items];
        items[index].quantity = quantity;
        set({ items });
        get().calculateCart();
    },

    calculateCart: async () => {
        const { items, customerId } = get();
        if (items.length === 0) {
            set({ total: 0 });
            return;
        }
        try {
            const payload = {
                items: items.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    price: i.price,
                    unit_id: i.unit_id || null,
                    is_open_box: i.is_open_box,
                    returned_item_id: i.returned_item_id
                })),
                customer_id: customerId
            };
            const res = await api.post('/cart/calculate', payload);
            set({ total: res.data.total });
        } catch (err) {
            console.error(err);
        }
    },

    setCustomer: (customerId) => {
        set({ customerId });
        get().calculateCart();
    },

    clearCart: () => set({ items: [], customerId: null, total: 0 })
}));
