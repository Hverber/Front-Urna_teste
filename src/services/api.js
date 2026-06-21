// Camada de integração com a API (Modulo-Urna).
// Todas as chamadas passam pelo proxy do Vite ("/api" -> backend),
// configurado em vite.config.js, o que evita problemas de CORS
// sem precisar alterar nada no backend.

const BASE = window.location.hostname === 'localhost'
    ? '/api'
    : 'https://modulo-urna-production.up.railway.app';

async function request(path, options = {}) {
    const config = { ...options }

    if (config.body !== undefined) {
        config.headers = { 'Content-Type': 'application/json', ...config.headers }
        config.body = JSON.stringify(config.body)
    }

    const response = await fetch(`${BASE}${path}`, config)
    const text = await response.text()

    let data = null
    if (text) {
        try {
            data = JSON.parse(text)
        } catch {
            data = text
        }
    }

    if (!response.ok) {
        const message =
            typeof data === 'string' && data
                ? data
                : `Erro ${response.status} ao chamar ${path}`
        throw new Error(message)
    }

    return data
}

export const api = {
    // Eleições
    listarEleicoes: () => request('/eleicoes'),
    eleicaoEstaAberta: (id) => request(`/eleicoes/${id}/aberta`),

    // Urnas
    urnasPorEleicao: (eleicaoId) => request(`/urnas/eleicao/${eleicaoId}`),
    listarUrnas: () => request('/urnas'),

    // Candidatos
    listarCandidatos: (eleicaoId, ufId) =>
        request(`/candidato?eleicaoId=${eleicaoId}&ufId=${ufId}`),

    // Eleitores
    listarEleitores: () => request('/eleitores'),

    // Controle de voto (já votou?)
    eleitorJaVotou: (eleitorId) => request(`/controle-votos/${eleitorId}`),
    removerControleVoto: (eleitorId) =>
        request(`/controle-votos/${eleitorId}`, { method: 'DELETE' }),

    // Voto
    votar: (voto, eleitorId) =>
        request(`/votos?eleitorId=${eleitorId}`, { method: 'POST', body: voto }),
}

function normalizar(texto) {
    return (texto || '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase()
}

// NOVA FUNÇÃO: Busca apenas os candidatos do estado do eleitor
export async function carregarCandidatosDaUf(eleicaoId, ufId) {
    return (await api.listarCandidatos(eleicaoId, ufId)) || []
}

// Carrega a eleição aberta e a urna. A lista de candidatos agora inicia vazia.
export async function carregarSessaoUrna() {
    const eleicoes = await api.listarEleicoes()

    if (!eleicoes || eleicoes.length === 0) {
        throw new Error('Nenhuma eleição cadastrada na API.')
    }

    // prioriza eleição com status "Eleição aberta"; senão usa a primeira
    const eleicao =
        eleicoes.find((e) => normalizar(e.status) === normalizar('Eleição aberta')) ||
        eleicoes[0]

    // tenta achar uma urna da eleição; senão, qualquer urna
    let urnas = []
    try {
        urnas = await api.urnasPorEleicao(eleicao.id)
    } catch {
        urnas = []
    }
    if (!urnas || urnas.length === 0) {
        try {
            urnas = await api.listarUrnas()
        } catch {
            urnas = []
        }
    }
    if (!urnas || urnas.length === 0) {
        throw new Error('Nenhuma urna cadastrada na API.')
    }

    //const urna = urnas[0]

    // A API só aceita votos se a eleição estiver aberta (status + datas)
    let aberta = false
    try {
        aberta = await api.eleicaoEstaAberta(eleicao.id)
    } catch {
        aberta = false
    }

    return { eleicao, urna: null, todasUrnas: urnas, candidatos: [], aberta }
}

// Busca eleitor pelo título (ou CPF) e garante que ainda não votou.
export async function identificarEleitor(documento) {
    const doc = (documento || '').replace(/\D/g, '')

    if (!doc) {
        throw new Error('Informe o título de eleitor ou CPF.')
    }

    const eleitores = (await api.listarEleitores()) || []

    const eleitor = eleitores.find(
        (e) =>
            (e.titulo || '').replace(/\D/g, '') === doc ||
            (e.cpf || '').replace(/\D/g, '') === doc,
    )

    if (!eleitor) {
        throw new Error(
            'Eleitor não encontrado. Faça o cadastro/check-in no administrativo.',
        )
    }

    const jaVotou = await api.eleitorJaVotou(eleitor.id)
    if (jaVotou) {
        throw new Error(`${eleitor.nome} já votou nesta eleição.`)
    }

    return eleitor
}

// Encontra o candidato pelo número digitado e pelo cargo da etapa.
export function buscarCandidato(candidatos, numeroDigitado, nomeCargo) {
    const numero = Number(numeroDigitado)
    if (!numero) return null

    return (
        candidatos.find(
            (c) =>
                c.numero === numero &&
                normalizar(c.cargo && c.cargo.nome) === normalizar(nomeCargo),
        ) || null
    )
}


const BUG_CONTROLE = /could not assign id/i

// Marca o eleitor como "já votou" enviando o objeto eleitor completo
// (formato que o @MapsId aceita).
async function registrarControleManual(eleitorId) {
    // enviar SÓ o objeto eleitor — incluir "eleitorId" junto faz o
    // Hibernate tratar como update e falhar com "null identifier"
    await request('/controle-votos', {
        method: 'POST',
        body: { eleitor: { id: eleitorId } },
    })
}

// O backend trava antes de incrementar a apuração; recria o registro
// com o total atualizado (a API não tem endpoint de update)
async function corrigirApuracao(escolhas, eleicao) {
    for (const escolha of escolhas) {
        if (!escolha.candidato) continue // branco/nulo não entra na apuração

        try {
            let atual = null
            try {
                atual = await request(
                    `/apuracao/buscar?candidatoId=${escolha.candidato.id}&eleicaoId=${eleicao.id}`,
                )
            } catch {
                atual = null // não existe ainda
            }

            const total = (atual && atual.totalVotos ? atual.totalVotos : 0) + 1

            if (atual && atual.id) {
                await request(`/apuracao/${atual.id}`, { method: 'DELETE' })
            }

            await request('/apuracao', {
                method: 'POST',
                body: {
                    candidato: { id: escolha.candidato.id },
                    eleicao: { id: eleicao.id },
                    totalVotos: total,
                },
            })
        } catch (e) {
            // apuração é secundária; não derruba o voto por causa dela
            console.warn('Falha ao corrigir apuração:', e.message)
        }
    }
}

// Envia todos os votos do eleitor.
//
// Caminho normal (API corrigida): o backend cria o ControleVoto no
// primeiro POST /votos; removemos o controle entre os votos
// intermediários e deixamos ativo só após o último.
// Caminho com bug: o POST salva o voto e falha no ControleVoto; nesse
// caso seguimos votando e, no final, registramos o controle e
// corrigimos a apuração manualmente.
export async function enviarVotos(escolhas, eleitorId, eleicao, urna) {
    let backendBugado = false

    for (let i = 0; i < escolhas.length; i++) {
        const escolha = escolhas[i]

        const voto = {
            candidato: escolha.candidato ? { id: escolha.candidato.id } : null,
            urna: { id: urna.id },
            eleicao: { id: eleicao.id },
        }

        try {
            await api.votar(voto, eleitorId)

            const ehUltimo = i === escolhas.length - 1
            if (!ehUltimo) {
                await api.removerControleVoto(eleitorId)
            }
        } catch (e) {
            if (BUG_CONTROLE.test(e.message)) {
                backendBugado = true // voto foi salvo; o crash foi só no controle
            } else {
                throw e
            }
        }
    }

    if (backendBugado) {
        await registrarControleManual(eleitorId)
        await corrigirApuracao(escolhas, eleicao)
    }
}