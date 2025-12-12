import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Tilt from 'react-parallax-tilt'
import './App.css'

function App() {
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [progress, setProgress] = useState({x:36})
  const [distance, setDistance] = useState(36)
  const [dragginStarted, setDragginStarted] = useState(false)
  const [packOpened, setPackOpened] = useState(false)
  
  // Случайное распределение цветов свечения для 3 карт
  const [glowDistribution] = useState(() => {
    const indices = [0, 1, 2, 3, 4]
    const colors = ['gold', 'purple', 'blue']
    
    // Перемешиваем индексы
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    // Перемешиваем цвета
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]]
    }
    
    // Создаем распределение: выбираем 3 случайных карты и назначаем им цвета
    const distribution = Array(5).fill(null)
    for (let i = 0; i < 3; i++) {
      distribution[indices[i]] = colors[i] 
    }
    
    return distribution
  })
  
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
    return normalized
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
        // Анимация завершена
        setProgress({ x: targetProgress })
        setDistance(targetDistance)
        setPackOpened(true)
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

  return (
    <div 
      className="app" 
      onMouseUp={handleMouseUp} 
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      
      <div className="wrapper">
      <div className={`glow-effect ${packOpened ? 'pack-opened' : ''}`}>
        <div style={dragginStarted ? {} : {opacity: 1}} className="glow-center">
          <div className="center-particle center-particle-1"></div>
          <div className="center-particle center-particle-2"></div>
          <div className="center-particle center-particle-3"></div>
          <div className="center-particle center-particle-4"></div>
          <div className="center-particle center-particle-5"></div>
          <div className="center-particle center-particle-6"></div>
          <div className="center-particle center-particle-7"></div>
          <div className="center-particle center-particle-8"></div>
        </div>
        <div style={{opacity: glowRaysOpacity}} className="glow-rays"></div> 
        <div  className={`glow-particles ${packOpened ? 'pack-opened' : ''}`}></div>
        <div  className={`glow-rings ${packOpened ? 'pack-opened' : ''}`}></div>
      </div>
        <div className={`cards-container ${packOpened ? 'pack-opened' : ''}`}>
            {[...Array(5)].map((_, index) => {
              const translateXValues = [-280, -165, -50, 65, 180]
              const rotateValues = [-8, -6, 0, 5, 7]
              const translateYValues = [5, 33, 50, 30, 3]
              const transform = !packOpened 
                ? `translateX(calc(-50% + ${index * 2}px)) translateY(${50-index * 3}px) rotate(${(index - 2) * 0.5}deg)` : 
                  `translateX(calc(${translateXValues[index]}%)) translateY(${50-translateYValues[index]}px) rotate(${rotateValues[index]}deg)`
              
              // Получаем цвет свечения для этой карты (может быть null)
              const glowType = glowDistribution[index]
              const glowClass = glowType ? `glow-${glowType}` : ''
              
              return (
              <div 
                key={index}
                className={`card card-${index + 1} ${glowClass}`}
                style={{
                  zIndex: 50 - index,
                  transform: transform,
                  
                }}
              >
                <div className="card-wrapper">
                  <img src={`${import.meta.env.BASE_URL}card1.png`} alt={`Card ${index + 1}`} />
                </div>
              </div>
            )})}
          </div>
      <Tilt
        ref={(node) => {
          containerRef.current = node
          // Tilt может передавать не DOM элемент напрямую, поэтому сохраняем как есть
          // и используем getParallaxElement() для безопасного получения DOM элемента
          parallaxElementRef.current = node
        }}
        className={`tilt-wrapper parallax-effect glare-scale ${packOpened ? 'pack-opened' : ''}`}
        tiltEnable={!packOpened}
        tiltMaxAngleX={dragginStarted ? 0 : 10}
        tiltMaxAngleY={dragginStarted ? 0 : 10}
        perspective={1000}
        glareEnable={!dragginStarted}
        glareColor={dragginStarted ? 'transparent' : 'white'}
        scale={dragginStarted ? 1 : 1.02}
        transitionSpeed={1000}
      >

          <div 
            id="top" 
            className="top" 
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
  )
}

export default App

