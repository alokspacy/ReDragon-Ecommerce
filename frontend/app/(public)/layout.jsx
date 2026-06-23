'use client'
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { setProduct } from "@/lib/features/product/productSlice";
import { setUser, setStoreInfo } from "@/lib/features/user/userSlice";
import { setAddresses } from "@/lib/features/address/addressSlice";
import { setCart } from "@/lib/features/cart/cartSlice";

export default function PublicLayout({ children }) {
    const dispatch = useDispatch();
    const token = useSelector(state => state.user.token);

    useEffect(() => {
        // 1. Fetch products
        const loadProducts = async () => {
            try {
                const data = await api.products.getAll();
                dispatch(setProduct(data));
            } catch (err) {
                console.error("Failed to load products:", err);
            }
        };

        loadProducts();
    }, [dispatch]);

    useEffect(() => {
        // 2. Fetch authenticated details if token exists
        const loadAuthDetails = async () => {
            const localToken = localStorage.getItem("redragon_token");
            if (localToken) {
                try {
                    const userData = await api.auth.getMe();
                    dispatch(setUser({ user: userData, token: localToken }));
                    
                    if (userData.cart) {
                        dispatch(setCart(userData.cart));
                    }
                    
                    // Fetch addresses
                    const addresses = await api.address.getAll();
                    dispatch(setAddresses(addresses));

                    // Fetch store status
                    const storeData = await api.stores.getStatus();
                    if (storeData.registered) {
                        dispatch(setStoreInfo(storeData));
                    }
                } catch (err) {
                    console.error("Session verification failed, logging out:", err);
                    api.auth.logout();
                    dispatch(setUser({ user: null, token: null }));
                }
            }
        };

        loadAuthDetails();
    }, [dispatch, token]);

    const cartItems = useSelector(state => state.cart.cartItems);
    const isAuthenticated = useSelector(state => state.user.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            const syncCart = async () => {
                try {
                    await api.auth.syncCart(cartItems);
                } catch (err) {
                    console.error("Failed to sync cart to database:", err);
                }
            };
            // Debounce or directly call
            const delayDebounceFn = setTimeout(() => {
                syncCart();
            }, 1000);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [cartItems, isAuthenticated]);

    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
