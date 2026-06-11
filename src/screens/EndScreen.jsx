export default function EndScreen({ eleitor }) {
  return (
    <main className="screen-content end-screen end-screen-column">
      <h2>FIM</h2>
      {eleitor && (
        <p className="end-message">
          Voto de {eleitor.nome} registrado com sucesso.
        </p>
      )}
      <p className="end-hint">Tecle confirmar para o próximo eleitor</p>
    </main>
  )
}
