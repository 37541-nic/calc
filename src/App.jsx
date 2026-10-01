import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Edges, OrbitControls } from '@react-three/drei'
import './App.css'

const initialDimensions = { width: 5, height: 2.8, thickness: 0.15 }

function Wall({ dimensions }) {
  const { width, height, thickness } = dimensions

  return (
    <>
      <mesh
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color="#d5e5d9" roughness={0.68} />
        <Edges color="#55796a" threshold={15} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.025, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#f5f4ee" />
      </mesh>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.28}
        scale={Math.max(width, height) * 2.5}
        blur={2.5}
        far={height * 2}
      />
    </>
  )
}

const fields = [
  { key: 'width', label: 'Comprimento', min: 0.5, max: 20, step: 0.1 },
  { key: 'height', label: 'Altura', min: 0.5, max: 10, step: 0.1 },
  { key: 'thickness', label: 'Espessura', min: 0.05, max: 1, step: 0.01 },
]

const brickOptions = [
  { id: 'six-hole', name: 'Tijolo de 6 furos', width: 9, height: 14, length: 19 },
  { id: 'eight-hole', name: 'Tijolo de 8 furos', width: 9, height: 19, length: 19 },
  { id: 'nine-hole', name: 'Tijolo de 9 furos', width: 11.5, height: 14, length: 24 },
  { id: 'solid', name: 'Tijolo maciço', width: 6.5, height: 10, length: 20 },
]

function App() {
  const [dimensions, setDimensions] = useState(initialDimensions)
  const [brickId, setBrickId] = useState(brickOptions[0].id)
  const selectedBrick = brickOptions.find((brick) => brick.id === brickId)
  const volume = dimensions.width * dimensions.height * dimensions.thickness
  const wallArea = dimensions.width * dimensions.height
  const mortarJoint = 0.015
  const brickFaceArea = (selectedBrick.length / 100 + mortarJoint)
    * (selectedBrick.height / 100 + mortarJoint)
  const bricksPerLayer = Math.ceil(wallArea / brickFaceArea)
  const layers = Math.ceil(dimensions.thickness / (selectedBrick.width / 100))
  const brickCount = Math.ceil(bricksPerLayer * layers * 1.1)
  const brickCoverage = (selectedBrick.length / 100 * selectedBrick.height / 100) / brickFaceArea
  const mortarVolume = volume * (1 - brickCoverage)
  const cementKg = mortarVolume * 1.33 / 7 * 1440
  const cementBags = Math.ceil(cementKg / 50)
  const formattedVolume = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(volume)
  const formatQuantity = (value, maximumFractionDigits = 0) => new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits,
  }).format(value)

  function updateDimension(key, value) {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      setDimensions((current) => ({ ...current, [key]: parsedValue }))
    } else if (value === '') {
      setDimensions((current) => ({ ...current, [key]: 0 }))
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace" id="inicio">
        <aside className="controls-panel">
          <h1>Calcule sua<br />parede.</h1>
          <p className="intro">Informe as medidas para descobrir o material necessário.</p>

          <div className="measurements">
            {fields.map((field, index) => (
              <div className="measure-field" key={field.key}>
                <div className="field-heading">
                  <label htmlFor={`${field.key}-number`}>
                    <span className="field-index">0{index + 1}</span>{field.label}
                  </label>
                  <div className="number-input-wrap">
                    <input
                      id={`${field.key}-number`}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={dimensions[field.key] || ''}
                      onChange={(event) => updateDimension(field.key, event.target.value)}
                      aria-label={`${field.label} em metros`}
                    />
                    <span>m</span>
                  </div>
                </div>
                <input
                  className="range-input"
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={Math.max(dimensions[field.key], field.min)}
                  onChange={(event) => updateDimension(field.key, event.target.value)}
                  aria-label={`Ajustar ${field.label.toLowerCase()}`}
                  style={{ '--range-progress': `${((dimensions[field.key] - field.min) / (field.max - field.min)) * 100}%` }}
                />
                <div className="range-limits"><span>{field.min.toFixed(field.step < 0.1 ? 2 : 1)} m</span><span>{field.max} m</span></div>
              </div>
            ))}
          </div>

          <div className="result-block" aria-live="polite">
            <div className="result-label"><span className="result-symbol">Σ</span> VOLUME TOTAL</div>
            <div className="result-value">{formattedVolume}<span>m³</span></div>
            <div className="formula">{dimensions.width || 0} × {dimensions.height || 0} × {dimensions.thickness || 0} <span>= volume</span></div>
          </div>

          <section className="materials-block" aria-labelledby="materials-heading" aria-live="polite">
            <div className="materials-heading-row">
              <div>
                <h2 id="materials-heading">O que você vai usar</h2>
              </div>
            </div>
            <label className="brick-select-label" htmlFor="brick-type">TIPO DE TIJOLO</label>
            <select
              id="brick-type"
              value={brickId}
              onChange={(event) => setBrickId(event.target.value)}
            >
              {brickOptions.map((brick) => (
                <option key={brick.id} value={brick.id}>
                  {brick.name} · {String(brick.width).replace('.', ',')} × {brick.height} × {brick.length} cm
                </option>
              ))}
            </select>

            <div className="material-results">
              <div className="material-stat brick-stat">
                <span>TIJOLOS</span>
                <strong>{formatQuantity(brickCount)} <small>un.</small></strong>
                <em>com 10% de sobra</em>
              </div>
              <div className="material-stat">
                <span>CIMENTO</span>
                <strong>{formatQuantity(cementKg, 1)} <small>kg</small></strong>
                <em>{cementBags} sacos de 50 kg</em>
              </div>
            </div>
            <div className="mortar-note">
              <span>ARGAMASSA ESTIMADA</span>
              <strong>{formatQuantity(mortarVolume, 3)} m³</strong>
            </div>
            <p className="disclaimer">Estimativa com junta de 1,5 cm e traço 1:6 (cimento:areia). A espessura arredonda para camadas inteiras; o consumo real varia com perdas, furos e execução.</p>
          </section>
        </aside>

        <section className="visual-panel" aria-label="Visualização tridimensional da parede">
          <div className="visual-topline">
            <div><span className="eyebrow light"> MODELO 3D</span><h2>Vista do projeto</h2></div>
            <span className="orbit-hint"><span className="orbit-icon">↻</span> ARRASTE PARA GIRAR</span>
          </div>
          <div className="canvas-frame">
            <Canvas shadows camera={{ position: [7, 5, 8], fov: 34 }}>
              <color attach="background" args={['#f1f3ed']} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[4, 8, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
              <directionalLight position={[-5, 3, -4]} intensity={0.65} color="#e5a35a" />
              <Wall dimensions={dimensions} />
              <OrbitControls
                makeDefault
                target={[0, dimensions.height / 2, 0]}
                minDistance={3}
                maxDistance={25}
                maxPolarAngle={Math.PI / 2 - 0.04}
              />
            </Canvas>
            <div className="canvas-coordinate coordinate-width">{dimensions.width} m <span>COMPRIMENTO</span></div>
            <div className="canvas-coordinate coordinate-height">{dimensions.height} m <span>ALTURA</span></div>
            <div className="canvas-stamp">ESCALA<br /><strong>1 : 1</strong></div>
          </div>
          <div className="model-footer">
            <span><i className="cube-icon" /> PAREDE RETANGULAR</span>
            <span>ESPESSURA <strong>{dimensions.thickness} m</strong></span>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
