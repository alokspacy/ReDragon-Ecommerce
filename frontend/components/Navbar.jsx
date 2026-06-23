'use client'
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "@/lib/features/user/userSlice";
import { api } from "@/lib/api";

const Navbar = () => {

    const router = useRouter();
    const dispatch = useDispatch();

    const [search, setSearch] = useState('')
    const cartCount = useSelector(state => state.cart.total)
    const user = useSelector(state => state.user.info)
    const storeInfo = useSelector(state => state.user.storeInfo)

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    const handleLogout = () => {
        api.auth.logout();
        dispatch(clearUser());
        router.push('/');
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                        <span className="text-red-600">Re</span>Dragon<span className="text-red-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-red-500">
                            plus
                        </p>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/shop">Shop</Link>
                        
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="text-red-600 font-medium">Admin Panel</Link>
                                )}
                                
                                {storeInfo && storeInfo.status === 'approved' ? (
                                    <Link href="/store" className="text-indigo-600 font-medium">Seller Dashboard</Link>
                                ) : (
                                    <Link href="/create-store" className="text-slate-500 hover:text-slate-700">Become Seller</Link>
                                )}

                                <Link href="/orders">My Orders</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/">About</Link>
                                <Link href="/">Contact</Link>
                            </>
                        )}

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-700">Hi, {user.name.split(' ')[0]}</span>
                                <button onClick={handleLogout} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 transition text-slate-700 rounded-full text-sm">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => router.push('/login')} className="px-8 py-2 bg-red-600 hover:bg-red-700 transition text-white rounded-full">
                                Login
                            </button>
                        )}

                    </div>

                    {/* Mobile User Button  */}
                    <div className="sm:hidden">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link href="/orders" className="text-sm font-medium text-slate-700 mr-2">Orders</Link>
                                <button onClick={handleLogout} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-xs transition text-slate-700 rounded-full">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => router.push('/login')} className="px-7 py-1.5 bg-red-600 hover:bg-red-700 text-sm transition text-white rounded-full">
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar