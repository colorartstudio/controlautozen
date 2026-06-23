const steps = [
  'Criar um projeto no Firebase Console.',
  'Ativar Authentication com o provedor desejado.',
  'Criar um banco Firestore em modo de desenvolvimento.',
  'Copiar as credenciais do app web para o arquivo .env.',
  'Configurar as mesmas variáveis no painel do Vercel.',
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
