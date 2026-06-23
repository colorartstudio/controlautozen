export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="hero">
        <span className="hero__eyebrow">React + Vite + Firebase</span>
        <h1>Control Auto Zen</h1>
        <p>
          Base pronta para versionar no GitHub, publicar no Vercel e conectar
          autenticação com Firestore via Firebase.
        </p>
      </header>
      <main>{children}</main>
    </div>
  )
}
