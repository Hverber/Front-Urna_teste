import { useState } from 'react'
import { identificarEleitor } from '../services/api'

export default function IdentifyScreen({ onIdentified }) {
  const [documento, setDocumento] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (carregando) return

    setErro('')
    setCarregando(true)

    try {
      const eleitor = await identificarEleitor(documento)
      onIdentified(eleitor)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="screen-content welcome-screen">
      <div className="welcome-center identify-center">
        <h2>Identificação do Eleitor</h2>
        <p className="identify-hint">
          Digite o título de eleitor (ou CPF) liberado no check-in do sistema
          administrativo.
        </p>

        <form className="identify-form" onSubmit={handleSubmit}>
          <input
            className="identify-input"
            type="text"
            inputMode="numeric"
            autoFocus
            placeholder="Título de eleitor ou CPF"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />

          <button
            type="submit"
            className="action-button confirm-button"
            disabled={carregando}
          >
            {carregando ? 'Verificando...' : 'Liberar voto'}
          </button>
        </form>

        {erro && <p className="identify-error">{erro}</p>}
      </div>

      <div className="bottom-panel">
        <p>O eleitor só é liberado se estiver cadastrado e ainda não tiver votado</p>
      </div>
    </main>
  )
}
