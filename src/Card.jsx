import React, { useRef } from 'react'

const Card = ({
  index,
  transform,
  glowClass,
  isFlipping,
  isFlipped,
  packOpened,
  onFlip,
}) => {
  const cardRef = useRef(null)
  const foilRef = useRef(null)

  const handleCardMouseEnter = () => {
    if (!cardRef.current) return
    
    cardRef.current.style.transition = 'transform 0.15s ease-out'
  }

  const handleCardMouseMove = (e) => {
    if (!cardRef.current || !foilRef.current) return


    const card = cardRef.current
    const foil = foilRef.current

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const midX = rect.width / 2
    const midY = rect.height / 2

    const rotateY = ((x - midX) / midX) * 10
    const rotateX = -((y - midY) / midY) * 10

    card.style.transform = `
      ${transform ?? ""}
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
    `

    foil.style.backgroundPosition = `
      ${50 + rotateY * 5}% 
      ${50 + rotateX * 5}%
    `
  }

  const handleCardMouseLeave = () => {
    if (!cardRef.current) return

    const card = cardRef.current
    
    card.style.transition = 'transform 0.5s ease-out'
    
    card.style.transform = transform ?? ""
  }

  return (
    <div
      onClick={() => onFlip(index)}
      onMouseEnter={handleCardMouseEnter}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave} 
      className={`card card-${index + 1} ${glowClass} ${isFlipping ? 'flipping' : ''} ${isFlipped ? 'flipped' : ''} ${packOpened ? `card-fallen card-fall-${index}` : ''}`}
      style={{
        zIndex: 50 - index,
        ...(transform && { transform }),
        transformStyle: 'preserve-3d',
      }}
    >
      <div ref={cardRef}>
        <div className="card-shadow">
          <div 
            className={`card-wrapper ${isFlipped ? 'rotated' : ''}`}
            onDragStart={(e) => e.preventDefault()}
            style={{ pointerEvents: isFlipped ? 'none' : 'auto' }}
          >
            <div className="card-front">
              <img src={`${import.meta.env.BASE_URL}card1.png`} alt={`Card ${index + 1}`}
              draggable={false} />
              <div ref={foilRef} className="foil"></div>
            </div>
            <div className="card-back">
              <img src={`${import.meta.env.BASE_URL}eth.png`} alt={`Card ${index + 1}`}
              draggable={false} />
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Card

