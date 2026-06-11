import ActionButtons from '../components/ActionButtons'
import DigitBoxes from '../components/DigitBoxes'
import PhotoArea from '../components/PhotoArea'

export default function VoteScreen({
  stage,
  digits,
  blankVote,
  candidato,
  onBlank,
  onCorrect,
  onConfirm,
}) {
  const numeroCompleto = digits.length === stage.digits

  let statusMessage = ''

  if (blankVote) {
    statusMessage = 'VOTO EM BRANCO'
  } else if (numeroCompleto && !candidato) {
    statusMessage = 'VOTO NULO'
  } else if (numeroCompleto) {
    statusMessage = 'NÚMERO PREENCHIDO'
  }

  return (
    <main className="screen-content vote-screen">
      <div className="vote-layout">
        <section className="vote-left">
          <p className="vote-title">Seu voto para:</p>

          <div className="cargo-block">
            <h2>{stage.cargo}</h2>
            <DigitBoxes total={stage.digits} digits={digits} />
          </div>

          {statusMessage && <p className="status-message">{statusMessage}</p>}

          <div className="info-fields">
            <p>
              Nome: <strong>{candidato ? candidato.nome : ''}</strong>
            </p>
            <p>
              Partido:{' '}
              <strong>
                {candidato && candidato.partido
                  ? candidato.partido.sigla || candidato.partido.nome
                  : ''}
              </strong>
            </p>
            {stage.fields
              .filter((field) => field !== 'Nome' && field !== 'Partido')
              .map((field) => (
                <p key={field}>{field}:</p>
              ))}
          </div>
        </section>

        <section className="vote-right">
          <PhotoArea cargo={stage.cargo} photos={stage.photos} />
        </section>
      </div>

      <div className="bottom-panel">
        <ActionButtons onBlank={onBlank} onCorrect={onCorrect} onConfirm={onConfirm} />
      </div>
    </main>
  )
}
