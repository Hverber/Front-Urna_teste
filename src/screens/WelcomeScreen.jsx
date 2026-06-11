import ActionButtons from '../components/ActionButtons'

export default function WelcomeScreen({ onConfirm }) {
  return (
    <main className="screen-content welcome-screen">
      <div className="welcome-center">
        <h2>Bem-vindo!</h2>
      </div>

      <div className="bottom-panel">
        <p>Tecle confirmar para iniciar</p>
        <ActionButtons welcome onConfirm={onConfirm} />
      </div>
    </main>
  )
}
