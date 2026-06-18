import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import WelcomeScreen from './screens/WelcomeScreen'
import IdentifyScreen from './screens/IdentifyScreen'
import VoteScreen from './screens/VoteScreen'
import SavingScreen from './screens/SavingScreen'
import EndScreen from './screens/EndScreen'
import { stages } from './data/stages'
import {
    carregarSessaoUrna,
    buscarCandidato,
    enviarVotos,
    carregarCandidatosDaUf
} from './services/api'

export default function App() {
    const [stageIndex, setStageIndex] = useState(0)
    const [digits, setDigits] = useState([])
    const [blankVote, setBlankVote] = useState(false)

    // Integração com a API
    const [sessao, setSessao] = useState(null) // { eleicao, urna, todasUrnas, candidatos, aberta }
    const [erroSessao, setErroSessao] = useState('')
    const [eleitor, setEleitor] = useState(null)
    const [escolhas, setEscolhas] = useState([])
    const [erroEnvio, setErroEnvio] = useState('')
    const enviandoRef = useRef(false)

    const stage = stages[stageIndex]

    // 1. Carrega eleição e urnas ao iniciar
    useEffect(() => {
        carregarSessaoUrna()
            .then((dados) => {
                setSessao(dados)
                setErroSessao('')
            })
            .catch((e) => setErroSessao(e.message))
    }, [])

    // 2. Busca a urna correta e os candidatos assim que o eleitor se identificar
    useEffect(() => {
        if (!sessao?.eleicao?.id || !eleitor) return

        // Encontra a Urna comparando o ID da Seção!
        const urnaCorreta = sessao.todasUrnas?.find((u) => {
            // Verifica se a urna tem uma seção e se o ID dela é igual ao ID da seção do eleitor
            return u.secao?.id && eleitor.secao?.id && String(u.secao.id) === String(eleitor.secao.id);
        })

        if (!urnaCorreta) {
            setErroSessao('Urna não encontrada para a seção deste eleitor.')
            return
        }

        // A UF do eleitor já vem pronta na raiz do objeto dele, conforme vimos no log: eleitor.uf.id
        const ufId = eleitor.uf?.id;

        if (!ufId) {
            setErroSessao('Não foi possível determinar o estado (UF) para carregar os candidatos.')
            return
        }

        carregarCandidatosDaUf(sessao.eleicao.id, ufId)
            .then((listaCandidatos) => {
                setSessao((prev) => ({
                    ...prev,
                    urna: urnaCorreta,
                    candidatos: listaCandidatos
                }))
                setErroSessao('') // Limpa qualquer erro
                nextStage() // Avança para a tela de voto!
            })
            .catch((e) => setErroSessao(`Erro ao buscar candidatos: ${e.message}`))
    }, [eleitor, sessao?.eleicao?.id])

    const numeroDigitado = digits.join('')

    const candidatosFiltrados = sessao?.candidatos || []

    const candidatoAtual =
        stage.type === 'vote' &&
        digits.length === stage.digits &&
        !blankVote
            ? buscarCandidato(candidatosFiltrados, numeroDigitado, stage.cargo)
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

    }

    function confirmVote() {
        if (stage.type === 'welcome') {
            nextStage()
            return
        }

        if (stage.type === 'vote') {
            const canConfirm = blankVote || digits.length === stage.digits

            if (canConfirm) {
                const escolha = {
                    cargo: stage.cargo,
                    candidato: blankVote ? null : candidatoAtual,
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

    useEffect(() => {
        if (stage.type !== 'saving') return

        if (!sessao || !eleitor || !sessao.urna) {
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
                <div className="api-banner">{erroSessao}</div>
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