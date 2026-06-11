export default function SavingScreen({ erro, onRestart }) {
  if (erro) {
    return (
      <main className="screen-content saving-screen">
        <div className="saving-content saving-error">
          <h2>Erro ao registrar o voto</h2>
          <p className="saving-error-message">{erro}</p>
          <button className="action-button confirm-button" onClick={onRestart}>
            Reiniciar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="screen-content saving-screen">
      <div className="saving-content">
        <h2>Guardando...</h2>
        <div className="progress-track">
          <div className="progress-fill" />
        </div>
      </div>
    </main>
  )
}
