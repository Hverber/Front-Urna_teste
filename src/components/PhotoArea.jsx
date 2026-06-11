export default function PhotoArea({ cargo, photos }) {
  if (cargo === 'Senador') {
    return (
      <div className="photo-area senator-layout">
        {photos.map((photo, index) => (
          <div
            key={photo.label}
            className={index === 2 ? 'photo-card last-senator-photo' : 'photo-card'}
          >
            <div className="photo-placeholder">FOTO</div>
            <span>{photo.label}</span>
          </div>
        ))}
      </div>
    )
  }

  const layoutClass = cargo === 'Governador' || cargo === 'Presidente'
    ? 'stacked-layout'
    : 'default-layout'

  return (
    <div className={`photo-area ${layoutClass}`}>
      {photos.map((photo) => (
        <div key={photo.label} className="photo-card">
          <div className="photo-placeholder">FOTO</div>
          <span>{photo.label}</span>
        </div>
      ))}
    </div>
  )
}
