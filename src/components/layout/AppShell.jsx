export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="hero">
        <span className="hero__eyebrow">React + Vite + Firebase</span>
        <h1>Control Auto Zen</h1>
        <p>
          Painel inicial com autenticacao real, perfis de usuarios no Firestore
          e base de seguranca para evoluir no GitHub, Vercel e Firebase.
        </p>
      </header>
      <main>{children}</main>
    </div>
  )
}
