export function SecurityRulesCard({ session }) {
  return (
    <section className="card">
      <h2>Regras e permissoes</h2>
      <ul className="status-list">
        <li>Firestore restringe leitura e escrita por autenticacao, dono do perfil e papel admin.</li>
        <li>Veiculos e agendamentos pertencem ao usuario logado; administradores conseguem ver todos.</li>
        <li>Realtime Database fica fechado por padrao, com espaco para presenca e trilhas administrativas.</li>
        <li>Promocao para admin e bloqueio de login passam por Vercel Functions com `firebase-admin`.</li>
        <li>O primeiro usuario nasce como `user`; promova um `admin` manualmente no documento `users/&lt;uid&gt;`.</li>
        <li>Seu papel atual: {session.profile?.role ?? 'visitante'}.</li>
      </ul>
    </section>
  )
}
