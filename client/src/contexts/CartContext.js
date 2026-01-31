import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCart, setCart as saveCart, clearCart as clearStoredCart } from '../utils/storage';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [promotionCode, setPromotionCode] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load cart from localStorage on mount
    useEffect(() => {
        const storedCart = getCart();
        if (storedCart && Array.isArray(storedCart)) {
            setCartItems(storedCart);
        }
        setLoading(false);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!loading) {
            saveCart(cartItems);
        }
    }, [cartItems, loading]);

    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item.masp === product.masp || item.MaSP === product.MaSP);

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(item =>
                    (item.masp === product.masp || item.MaSP === product.MaSP)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [...prevItems, { ...product, quantity, selected: true }];
            }
        });
        toast.success('Đã thêm sản phẩm vào giỏ hàng!');
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter(item =>
            item.masp !== productId && item.MaSP !== productId
        ));
        toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map(item =>
                (item.masp === productId || item.MaSP === productId)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const toggleSelection = (productId) => {
        setCartItems((prevItems) =>
            prevItems.map(item =>
                (item.masp === productId || item.MaSP === productId)
                    ? { ...item, selected: !item.selected }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        clearStoredCart();
    };

    const getCartTotal = () => {
        return cartItems
            .filter(item => item.selected !== false)
            .reduce((total, item) => {
                const price = item.giaban || item.GiaBan || item.DonGia || 0;
                const discount = item.PhanTramGiam || item.GiamGia || 0;
                const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
                return total + (finalPrice * item.quantity);
            }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const applyPromotion = (code) => {
        setPromotionCode(code);
    };

    const removePromotion = () => {
        setPromotionCode(null);
    };

    const value = {
        cartItems,
        promotionCode,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelection,
        clearCart,
        getCartTotal,
        getCartCount,
        applyPromotion,
        removePromotion,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
