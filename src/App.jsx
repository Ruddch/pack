import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Tilt from 'react-parallax-tilt'
import Card from './Card'
import './App.css'

function App() {
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [progress, setProgress] = useState({x:36})
  const [distance, setDistance] = useState(36)
  const [dragginStarted, setDragginStarted] = useState(false)
  const [packOpened, setPackOpened] = useState(false)
  const [flippedCards, setFlippedCards] = useState(new Set())
  const [flippingCards, setFlippingCards] = useState(new Set())
  

  const glowDistribution = ['gold', 'purple', 'blue', 'silver', 'silver']
  
  const containerRef = useRef(null)
  const packRectRef = useRef(null)
  const angleContainerRef = useRef(null)
  const angleElementRef = useRef(null)
  const topElementRef = useRef(null)
  const parallaxElementRef = useRef(null)
  const rafIdRef = useRef(null)
  const animationRafIdRef = useRef(null)
  const animationStartTimeRef = useRef(null)
  const animationStartProgressRef = useRef(null)
  const animationStartDistanceRef = useRef(null)
  
  // Вспомогательная функция для безопасного получения DOM элемента
  const getParallaxElement = useCallback(() => {
    // Проверяем, является ли ref DOM элементом
    if (parallaxElementRef.current && typeof parallaxElementRef.current.getBoundingClientRect === 'function') {
      return parallaxElementRef.current
    }
    // Если нет, ищем через containerRef
    if (containerRef.current) {
      const element = containerRef.current.querySelector?.('.parallax-effect') || containerRef.current
      if (element && typeof element.getBoundingClientRect === 'function') {
        return element
      }
    }
    // Последняя попытка - через querySelector
    const element = document.querySelector('.parallax-effect')
    return element && typeof element.getBoundingClientRect === 'function' ? element : null
  }, [])
  
  // Вычисляем угол поворота для направления правой стороны элемента к вершине вектора
  const calculateRotationAngle = useCallback(() => {
    if (!dragginStarted || !packRectRef.current || !topElementRef.current) return 0
    
    const topRect = topElementRef.current.getBoundingClientRect()
    const packRect = packRectRef.current
    
    const topLeftX = topRect.left - packRect.left
    const topLeftY = topRect.top - packRect.top
    
    const angleContainerRightX = topLeftX
    const angleContainerRightY = topLeftY
    
    const dx = mousePos.x - angleContainerRightX
    const dy = mousePos.y - angleContainerRightY
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90
    
    return Math.max(-90, Math.min(0, angle))
  }, [dragginStarted, mousePos.x, mousePos.y])
  
  // Мемоизируем угол поворота
  const rotationAngle = useMemo(() => {
    return calculateRotationAngle()
  }, [calculateRotationAngle])
  
  // Мемоизируем вычисление градиента
  const volumeGradient = useMemo(() => {
    if (progress.x <= 36) {
      return 'linear-gradient(135deg,rgba(155, 156, 152, 0.5) 50%, rgba(255, 250, 250, 0.6) 60%, rgba(176, 174, 174, 0.5) 73%, rgba(153, 153, 153, 0.6) 88%, rgba(115, 112, 112, 0.7) 100%)';
    }
    
    const angleElement = angleElementRef.current
    const angleContainer = angleContainerRef.current
    if (!angleElement || !angleContainer) {
      return 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(243, 243, 243, 0.6) 45%, rgba(221, 221, 221, 0.5) 50%, rgba(170, 170, 170, 0.4) 50%, rgba(187, 187, 187, 0.5) 56%, rgba(204, 204, 204, 0.6) 62%, rgba(243, 243, 243, 0.6) 80%, rgba(255, 255, 255, 0.7) 100%)' 
    }
    
    const height = angleContainer.style.height.replace('px', '')
    const startGradient = 100 - (height - 16) / height * 100
    const diagonalAngle = 135 - rotationAngle * 0.5 
    return `linear-gradient(${diagonalAngle}deg, 
      rgba(155, 156, 152, 0.5) ${startGradient}%, 
      rgba(255, 250, 250, 0.6) ${startGradient + 10}%, 
      rgba(176, 174, 174, 0.5) ${startGradient + 23}%, 
      rgba(153, 153, 153, 0.6) 88%, 
      rgba(115, 112, 112, 0.7) 100%)`
  }, [progress.x, rotationAngle])
  
  // Обновляем градиент при изменении состояния (только когда нужно)
  useEffect(() => {
    if (angleElementRef.current && volumeGradient) {
      angleElementRef.current.style.setProperty('--volume-gradient', volumeGradient)
    }
  }, [volumeGradient])
  
  // Мемоизируем clipPath
  const clipPath = useMemo(() => {
    if (!dragginStarted || progress.x < 36) {
      return '50% 50%'
    }
    return `0px ${36 + rotationAngle * 0.4}px`
  }, [dragginStarted, progress.x, rotationAngle])

  // Вычисляем opacity для glow-rays на основе distance
  const glowRaysOpacity = useMemo(() => {
    const minDistance = 36
    const maxDistance = 473
    // Нормализуем distance от 0 до 1
    const normalized = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)))
    // Применяем easing: быстрее в начале, медленнее в конце (ease-out)
    // Используем квадратичную функцию для плавного замедления
    const eased = 1 - Math.pow(1 - normalized, 2)
    return eased
  }, [distance])

  // Easing функция для плавной анимации (easeOutCubic)
  const easeOutCubic = useCallback((t) => {
    return 1 - Math.pow(1 - t, 3)
  }, [])

  // Функция анимации открытия пакета до конца
  const animateToEnd = useCallback(() => {
    const duration = 400 // длительность анимации в миллисекундах
    const targetProgress = 473
    const targetDistance = 473

    const animate = (currentTime) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = currentTime
      }

      const elapsed = currentTime - animationStartTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      // Интерполируем значения
      const currentProgressX = animationStartProgressRef.current + 
        (targetProgress - animationStartProgressRef.current) * easedProgress
      const currentDistance = animationStartDistanceRef.current + 
        (targetDistance - animationStartDistanceRef.current) * easedProgress

      // Обновляем состояние
      setProgress({ x: currentProgressX })
      setDistance(currentDistance)
      
      // Обновляем mousePos для правильного расчета угла поворота
      setMousePos(prev => ({ x: 1000, y: prev.y }))

      // Продолжаем анимацию если не достигли конца
      if (progress < 1) {
        animationRafIdRef.current = requestAnimationFrame(animate)
      } else {
        setPackOpened(true)
        // Анимация завершена
        setProgress({ x: targetProgress })
        setDistance(targetDistance)
        
        console.log(progress, distance)
        animationStartTimeRef.current = null
        animationRafIdRef.current = null
      }
    }

    animationRafIdRef.current = requestAnimationFrame(animate)
  }, [easeOutCubic])

  // Универсальная функция для получения координат из события
  const getEventCoordinates = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }, [])

  // Оптимизированный обработчик движения мыши/касания с requestAnimationFrame
  const handleMove = useCallback((e) => {
    if (!isDragging) return
    
    e.preventDefault()
    
    // Отменяем предыдущий кадр если он еще не выполнился
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      const packElement = getParallaxElement()
      if (packElement) {
        const rect = packElement.getBoundingClientRect()
        packRectRef.current = rect
        const coords = getEventCoordinates(e)
        const relativeX = coords.x - rect.left
        const relativeY = coords.y - rect.top
        const relativeZ = Math.sqrt(relativeX * relativeX + relativeY * relativeY)

        const alpha = Math.min(Math.PI / 4, Math.max(0, Math.atan(relativeY / relativeX)))
        const newDistance = Math.min(473, Math.max(36, relativeZ / (2 * Math.cos(alpha))))
        const newProgressX = Math.min(473, Math.max(36, relativeX))

        // Батчим все setState в один ререндер
        setMousePos({ x: relativeX, y: relativeY })
        setProgress({x: newProgressX})
        setDistance(newDistance)
        console.log(newProgressX, newDistance)
      }
    })
  }, [isDragging, getParallaxElement, getEventCoordinates])

  const handleMouseMove = handleMove
  const handleTouchMove = handleMove

  const handleStart = useCallback((e) => {
    // Отменяем анимацию если она идет
    if (animationRafIdRef.current) {
      cancelAnimationFrame(animationRafIdRef.current)
      animationRafIdRef.current = null
      animationStartTimeRef.current = null
    }

    setIsDragging(true)
    setDragginStarted(true)
    
    const packElement = getParallaxElement()
    if (packElement) {
      const rect = packElement.getBoundingClientRect()
      packRectRef.current = rect
      const coords = getEventCoordinates(e)
      const relativeX = coords.x - rect.left
      const relativeY = coords.y - rect.top
      setMousePos({ x: relativeX, y: relativeY })
    }
  }, [getParallaxElement, getEventCoordinates])

  const handleMouseDown = handleStart
  const handleTouchStart = handleStart
  
  const handleEnd = useCallback((e) => {
    if (!isDragging) return
    setIsDragging(false)
    
    // Очищаем requestAnimationFrame при отпускании
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // Сохраняем текущие значения как начальные для анимации
    animationStartProgressRef.current = progress.x
    animationStartDistanceRef.current = distance
    animationStartTimeRef.current = null

    // Запускаем анимацию открытия пакета до конца
    animateToEnd()
  }, [isDragging, progress.x, distance, animateToEnd])

  const handleMouseUp = handleEnd
  const handleTouchEnd = handleEnd
  
  // Обработчик клика для переворота карточки
  const handleCardFlip = useCallback((index) => {
    // Проверяем, что карта еще не перевернута
    if (flippedCards.has(index)) return
    
    // Добавляем в flipping для применения scale + glow
    setFlippingCards(prev => new Set(prev).add(index))
    
    // Через 500ms (длительность анимации) добавляем в flipped
    setTimeout(() => {
      setFlippedCards(prev => new Set(prev).add(index))
    }, 0)
  }, [flippedCards])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (animationRafIdRef.current) {
        cancelAnimationFrame(animationRafIdRef.current)
      }
    }
  }, [])

  // Обработчик пробела: открытие пака и переворот карт
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        // Игнорируем повторные срабатывания при удержании клавиши
        if (e.repeat) {
          return
        }
        
        console.log('space')
        e.preventDefault()
        
        // 🎴 ЕСЛИ ПАК ЕЩЕ НЕ ОТКРЫТ - открываем его
        if (!packOpened && !animationRafIdRef.current) {
          // Устанавливаем флаг начала перетаскивания
          setDragginStarted(true)
          
          // Отменяем текущий RAF если есть
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
          }
          
          // Сбрасываем isDragging если был активен
          if (isDragging) {
            setIsDragging(false)
          }
          
          // Получаем координаты пака для расчета угла
          const packElement = getParallaxElement()
          if (packElement) {
            const rect = packElement.getBoundingClientRect()
            packRectRef.current = rect
            const relativeX = rect.left
            const relativeY = rect.top
            setMousePos({ x: relativeX, y: relativeY })
          }
          
          // Сохраняем начальные значения для анимации
          animationStartProgressRef.current = progress.x
          animationStartDistanceRef.current = distance
          animationStartTimeRef.current = null
          
          // Запускаем анимацию
          animateToEnd()
        } 
        // 🔄 ЕСЛИ ПАК УЖЕ ОТКРЫТ - переворачиваем карты
        else if (packOpened) {
          // Находим первую неперевернутую карту слева направо (0 -> 4)
          for (let i = 0; i < 5; i++) {
            if (!flippedCards.has(i)) {
              setFlippedCards(prev => new Set(prev).add(i))
              break // Переворачиваем только одну
            }
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [packOpened, progress.x, distance, animateToEnd, isDragging, flippedCards])
  return (
    <div 
      className="app" 
      onMouseUp={handleMouseUp} 
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      
      <div className="wrapper">
        <div className={`cards-container ${packOpened ? 'pack-opened' : ''}`}>
            {[...Array(5)].map((_, index) => {
              // Для закрытого пака используем исходную позицию, для открытого - анимация сама установит позицию
              const transform = !packOpened 
                ? `translateX(calc(-50% + ${index * 2}px)) translateY(${50-index * 3}px) rotate(${(index - 2) * 0.5}deg)` : 
                  undefined
              
              // Получаем цвет свечения для этой карты (может быть null)
              const glowType = glowDistribution[index]
              const glowClass = glowType ? `glow-${glowType}` : ''
              const isFlipping = flippingCards.has(index)
              const isFlipped = flippedCards.has(index)
              
              return (
                <Card
                  key={index}
                  index={index}
                  transform={transform}
                  glowClass={glowClass}
                  isFlipping={isFlipping}
                  isFlipped={isFlipped}
                  packOpened={packOpened}
                  onFlip={handleCardFlip}
                />
              )
            })}
        </div>
        <div style={{opacity: glowRaysOpacity}}  className={`glow-backlight-particles ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}>
          <div className="backlight-particle backlight-particle-1"></div>
          <div className="backlight-particle backlight-particle-2"></div>
          <div className="backlight-particle backlight-particle-3"></div>
          <div className="backlight-particle backlight-particle-4"></div>
          <div className="backlight-particle backlight-particle-5"></div>
          <div className="backlight-particle backlight-particle-6"></div>
          <div className="backlight-particle backlight-particle-7"></div>
          <div className="backlight-particle backlight-particle-8"></div>
        </div>
        <div style={{opacity: glowRaysOpacity}} className={`glow-backlight ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}>
          <div className="glow-ellipse glow-ellipse-1"></div>
          <div className="glow-ellipse glow-ellipse-2"></div>
          <div className="glow-ellipse glow-ellipse-3"></div>
        </div>
        <div className={`animation-container ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}>
          <div className={`glow-effect ${distance >= 460 ? 'pack-opened' : ''}`}>
            <div style={dragginStarted ? {} : {opacity: 1}} className="glow-center">
            </div>
            {/* glowRaysOpacity */}
            
            {/* <div  className={`glow-particles ${packOpened ? 'pack-opened' : ''}`}></div>
            <div  className={`glow-rings ${packOpened ? 'pack-opened' : ''}`}></div> */}
          </div>
          <Tilt
            ref={(node) => {
              containerRef.current = node
              // Tilt может передавать не DOM элемент напрямую, поэтому сохраняем как есть
              // и используем getParallaxElement() для безопасного получения DOM элемента
              parallaxElementRef.current = node
            }}
            className={`tilt-wrapper parallax-effect glare-scale ${distance >= 460 ? 'pack-opened' : ''}`}
            tiltEnable={!packOpened}
            tiltMaxAngleX={dragginStarted ? 0 : 10}
            tiltMaxAngleY={dragginStarted ? 0 : 10}
            perspective={1000}
            glareEnable={!dragginStarted}
            glareColor={dragginStarted ? 'transparent' : 'rgba(250, 195, 132, 0.3)'}
            glarePosition='bottom'
            glareBorderRadius='10px'
            scale={dragginStarted ? 1 : 1.02}
            transitionSpeed={1000}
          >

              <div 
                id="top" 
                className={`top ${distance >= 460 ? 'pack-opened' : ''}`} 
                ref={topElementRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ width: `calc(100% - ${distance}px)` }}
              > 
                <div
                  ref={angleContainerRef}
                  style={{ 
                    height: Math.max(36, distance - 36), 
                    transform: `translateX(-100%) rotateZ(${dragginStarted ? rotationAngle : 0}deg)` 
                  }}
                  className={`angle-container ${dragginStarted ? 'active' : ''}`}>
                  
                  <div 
                  ref={angleElementRef}
                  style={{
                    ...(dragginStarted ? { clipPath: `polygon(${clipPath}, 100% 0, 100% 100%, 0% 100%)` } : {})
                  }}
                  className={`angle ${dragginStarted ? 'active' : ''}`}></div>
                </div>
              </div>
              
              <div id="bottom" className="bottom">
                <div className="inner-element">
                  
                </div>
              </div>
          </Tilt>
        </div>
      </div>
      
      
    </div>
  )
}

export default App

