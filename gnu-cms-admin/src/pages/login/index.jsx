import React, { useState } from 'react'

import { Link, useNavigate } from 'react-router'

import { login } from '../../functions/fetch'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')
        setLoading(true)

        const res = await login(email, password)

        setLoading(false)

        if (res.status === 'success') {
            navigate('/home')
        } else {
            setError(res?.meta?.message || 'No se pudo iniciar sesión')
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0b0611] px-6 text-white">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <Link to="/" className="text-sm text-white/50 transition hover:text-white/80">
                    &larr; Back
                </Link>

                <h1 className="mt-4 text-2xl font-bold tracking-tight">Sign in</h1>
                <p className="mt-1 text-sm text-white/60">Welcome back to GNU CMS.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm text-white/70">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#863bff]"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm text-white/70">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 pr-10 text-sm outline-none focus:border-[#863bff]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 transition hover:text-white/70"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" className="size-4.5">
                                        <path d="M2.5 10.833s2.917-5.833 7.5-5.833 7.5 5.833 7.5 5.833-2.917 5.834-7.5 5.834-7.5-5.834-7.5-5.834Z" />
                                        <circle cx="10" cy="10.833" r="2.083" />
                                        <path d="M3 3l14 15.667" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" className="size-4.5">
                                        <path d="M2.5 10.833s2.917-5.833 7.5-5.833 7.5 5.833 7.5 5.833-2.917 5.834-7.5 5.834-7.5-5.834-7.5-5.834Z" />
                                        <circle cx="10" cy="10.833" r="2.083" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-rose-400">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </main>
    )
}
