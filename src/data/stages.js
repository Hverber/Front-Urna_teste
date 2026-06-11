export const stages = [
  {
    type: 'welcome',
  },
  {
    type: 'identify',
  },
  {
    type: 'vote',
    cargo: 'Deputado Federal',
    digits: 4,
    photos: [{ label: 'Deputado Federal' }],
    fields: ['Nome', 'Partido'],
  },
  {
    type: 'vote',
    cargo: 'Deputado Estadual',
    digits: 5,
    photos: [{ label: 'Deputado Estadual' }],
    fields: ['Nome', 'Partido'],
  },
  {
    type: 'vote',
    cargo: 'Senador',
    digits: 3,
    photos: [
      { label: 'Senador(a)' },
      { label: '1º Suplente' },
      { label: '2º Suplente' },
    ],
    fields: ['Nome', 'Partido', '1º Suplente', '2º Suplente'],
  },
  {
    type: 'vote',
    cargo: 'Governador',
    digits: 2,
    photos: [{ label: 'Governador' }, { label: 'Vice-Governador' }],
    fields: ['Nome', 'Partido'],
  },
  {
    type: 'vote',
    cargo: 'Presidente',
    digits: 2,
    photos: [{ label: 'Presidente' }, { label: 'Vice-Presidente' }],
    fields: ['Nome', 'Partido', 'Vice-Presidente'],
  },
  {
    type: 'saving',
  },
  {
    type: 'end',
  },
]
