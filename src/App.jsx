import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import WelcomeScreen from './screens/WelcomeScreen'
import IdentifyScreen from './screens/IdentifyScreen'
import VoteScreen from './screens/VoteScreen'
import SavingScreen from './screens/SavingScreen'
import EndScreen from './screens/EndScreen'
import { stages } from './data/stages'
import { carregarSessaoUrna, buscarCandidato, enviarVotos } from './services/api'

export default function App() {
  const [stageIndex, setStageIndex] = useState(0)
  const [digits, setDigits] = useState([])
  const [blankVote, setBlankVote] = useState(false)

  // Integração com a API
  const [sessao, setSessao] = useState(null) // { eleicao, urna, candidatos }
  const [erroSessao, setErroSessao] = useState('')
  const [eleitor, setEleitor] = useState(null)
  const [escolhas, setEscolhas] = useState([])
  const [erroEnvio, setErroEnvio] = useState('')
  const enviandoRef = useRef(false)

  const stage = stages[stageIndex]

  // Carrega eleição, urna e candidatos ao iniciar
  useEffect(() => {
    carregarSessaoUrna()
      .then((dados) => {
        setSessao(dados)
        setErroSessao('')
      })
      .catch((e) => setErroSessao(e.message))
  }, [])

  const numeroDigitado = digits.join('')
  const candidatoAtual =
    stage.type === 'vote' && sessao && digits.length === stage.digits && !blankVote
      ? buscarCandidato(sessao.candidatos, numeroDigitado, stage.cargo)
      : null

  function clearVote() {
    setDigits([])
    setBlankVote(false)
  }

  function nextStage() {
    setStageIndex((current) => Math.min(current + 1, stages.length - 1))
    clearVote()
  }

  function restart() {
    setStageIndex(0)
    clearVote()
    setEleitor(null)
    setEscolhas([])
    setErroEnvio('')
    enviandoRef.current = false
  }

  function handleIdentified(eleitorEncontrado) {
    setEleitor(eleitorEncontrado)
    nextStage()
  }

  function confirmVote() {
    if (stage.type === 'welcome') {
      nextStage()
      return
    }

    if (stage.type === 'vote') {
      const canConfirm = blankVote || digits.length === stage.digits

      if (canConfirm) {
        // registra a escolha desta etapa (candidato, branco ou nulo)
        const escolha = {
          cargo: stage.cargo,
          candidato: blankVote ? null : candidatoAtual, // sem match = voto nulo
          branco: blankVote,
        }
        setEscolhas((atuais) => [...atuais, escolha])
        nextStage()
      }
      return
    }

    if (stage.type === 'end') {
      restart()
    }
  }

  function correctVote() {
    if (stage.type === 'vote') {
      clearVote()
    }
  }

  function voteBlank() {
    if (stage.type === 'vote') {
      setDigits([])
      setBlankVote(true)
    }
  }

  function addDigit(digit) {
    if (stage.type !== 'vote') return

    const currentDigits = blankVote ? [] : digits

    if (currentDigits.length >= stage.digits) return

    setBlankVote(false)
    setDigits([...currentDigits, digit])
  }

  // Na etapa "saving", envia os votos para a API
  useEffect(() => {
    if (stage.type !== 'saving') return

    if (!sessao || !eleitor) {
      // sem API/eleitor (modo demonstração): só avança
      const timer = setTimeout(() => nextStage(), 1800)
      return () => clearTimeout(timer)
    }

    if (enviandoRef.current) return
    enviandoRef.current = true

    enviarVotos(escolhas, eleitor.id, sessao.eleicao, sessao.urna)
      .then(() => {
        setErroEnvio('')
        nextStage()
      })
      .catch((e) => {
        setErroEnvio(e.message)
      })
      .finally(() => {
        enviandoRef.current = false
      })
  }, [stage.type])

  useEffect(() => {
    function handleKeyDown(event) {
      // na identificação o input cuida do teclado
      if (stage.type === 'identify') return

      if (/^[0-9]$/.test(event.key)) {
        addDigit(event.key)
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        correctVote()
        return
      }

      if (event.key === 'Enter') {
        confirmVote()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stage, digits, blankVote, candidatoAtual])

  return (
    <div className="app-shell">
      <Header />

      {erroSessao && (
        <div className="api-banner">Falha ao conectar na API: {erroSessao}</div>
      )}

      {sessao && !sessao.aberta && (
        <div className="api-banner">
          Atenção: a eleição "{sessao.eleicao.nome}" não está aberta (status e
          datas). A API vai recusar os votos.
        </div>
      )}

      {stage.type === 'welcome' && <WelcomeScreen onConfirm={confirmVote} />}

      {stage.type === 'identify' && (
        <IdentifyScreen onIdentified={handleIdentified} />
      )}

      {stage.type === 'vote' && (
        <VoteScreen
          stage={stage}
          digits={digits}
          blankVote={blankVote}
          candidato={candidatoAtual}
          onBlank={voteBlank}
          onCorrect={correctVote}
          onConfirm={confirmVote}
        />
      )}

      {stage.type === 'saving' && (
        <SavingScreen erro={erroEnvio} onRestart={restart} />
      )}

      {stage.type === 'end' && <EndScreen eleitor={eleitor} />}
    </div>
  )
}
