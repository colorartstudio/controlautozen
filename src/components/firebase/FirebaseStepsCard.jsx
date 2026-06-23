const steps = [
  'Criar um projeto no Firebase Console.',
  'Ativar Authentication com Email/Senha e Google.',
  'Criar um banco Firestore em modo de desenvolvimento.',
  'Habilitar Realtime Database se precisar de sincronizacao em tempo real.',
  'Ativar Analytics para acompanhar eventos e uso da aplicacao.',
  'Copiar as credenciais do app web para o arquivo .env.',
  'Promover manualmente um primeiro admin no documento users/<uid>.',
  'Configurar as variaveis FIREBASE_ADMIN_* no painel do Vercel.',
  'Publicar o projeto no Vercel para ativar as rotas /api/admin.',
  'Publicar firestore.rules e database.rules.json com o Firebase CLI.',
]

export function FirebaseStepsCard() {
  return (
    <section className="card">
      <h2>Próximos passos</h2>
      <ol className="steps-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  )
}
