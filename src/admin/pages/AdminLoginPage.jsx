import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "../pages/page.css"
const AdminLoginPage = () => {
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND; // ✅ No extra spaces~

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);

        const loginUrl = "https://web-backend-eta.vercel.app/api/auth/login"; // ✅ Fixed spacing

        try {
            const res = await axios.post(
                loginUrl,
                { email, password },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            
            if (res.status === 200) {
                toast.success("Login Successful!");

                // ✅ Store data in localStorage
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("userId", res.data.userId);
                localStorage.setItem("isAdmin", res.data.isAdmin);

                console.log("Token stored:", localStorage.getItem("token"));
                
                navigate("/");
            }
            
        } catch (error) {
            if (error.response) {
                toast.error(
                    error.response.status === 400
                        ? "Incorrect credentials"
                        : "Something went wrong!"
                );
            } else {
                toast.error("Internal Server Error!");
            }
            console.log(`Error during login: ${error}`); // ✅ Fixed syntax
        } finally {
            setLoginLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            window.open(`${backendUrl}/auth/google/callback`, "_self"); // ✅ Fixed spacing
        } catch (error) {
            console.log(error);
            toast.error("Google login failed!");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div id="login" className="flex justify-center items-center min-h-screen bg-gray-100">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 m-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Login to Classic Optic Inventory
                    </h2>
                    {/* <p className="text-gray-600 text-sm">
                        Access premium motorcycle gear and manage your orders
                    </p> */}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label
                            htmlFor="email"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-5">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center text-gray-600 text-sm">
                            <input
                                type="checkbox"
                                className="mr-2 h-4 w-4 accent-yellow-500"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                            />
                            Remember me
                        </label>
                        <a
                            href="#"
                            className="text-yellow-500 text-sm font-medium hover:text-yellow-600 hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white py-3 rounded-md font-medium uppercase tracking-wide hover:bg-gray-900 transition duration-200 flex justify-center items-center"
                        disabled={loginLoading || googleLoading}
                    >
                        {loginLoading ? "Processing..." : "Login"}
                    </button>
                </form>

                {/* <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-sm">
                        OR
                    </span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div> */}

                {/* <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex justify-center items-center bg-white border border-gray-300 rounded-md py-3 px-4 text-gray-700 hover:bg-gray-50 transition duration-200"
                    disabled={loginLoading || googleLoading}
                >
                    {googleLoading ? "Processing..." : "Continue with Google"}
                </button> */}

                <div className="text-center mt-6">
                    <span className="text-gray-600 text-sm">
                        Don't have an account?
                    </span>
                    <a
                        href="/signup"
                        className="text-yellow-500 text-sm font-medium ml-1 hover:text-yellow-600 hover:underline"
                    >
                        Sign up
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
