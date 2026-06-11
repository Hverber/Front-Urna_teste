export default function ActionButtons({ welcome = false, onBlank, onCorrect, onConfirm }) {
  if (welcome) {
    return (
      <div className="single-button-area">
        <button className="action-button confirm-button" onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    )
  }

  return (
    <div className="button-area">
      <button className="action-button blank-button" onClick={onBlank}>
        Voto em branco
      </button>

      <button className="action-button correct-button" onClick={onCorrect}>
        Corrigir
      </button>

      <button className="action-button confirm-button" onClick={onConfirm}>
        Confirmar
      </button>
    </div>
  )
}
