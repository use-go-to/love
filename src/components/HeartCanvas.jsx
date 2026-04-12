// src/components/HeartCanvas.jsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeartCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // Forme cœur
    const shape = new THREE.Shape()
    shape.moveTo(0.5, 0.5)
    shape.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0)
    shape.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7)
    shape.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9)
    shape.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7)
    shape.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0)
    shape.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3, bevelEnabled: true, bevelSegments: 8,
      steps: 2, bevelSize: 0.08, bevelThickness: 0.08
    })
    geo.center()

    const matOuter = new THREE.MeshPhongMaterial({ color: 0xc45f82, emissive: 0x3a0018, specular: 0xff88aa, shininess: 80 })
    const matGlow  = new THREE.MeshPhongMaterial({ color: 0xe8a0b4, emissive: 0x5a1030, transparent: true, opacity: 0.5, side: THREE.BackSide })

    const heart = new THREE.Mesh(geo, matOuter)
    const glow  = new THREE.Mesh(geo, matGlow)
    glow.scale.setScalar(1.08)
    scene.add(heart, glow)

    // Mini cœurs en orbite
    const minis = Array.from({ length: 4 }, (_, i) => {
      const m = new THREE.Mesh(
        (() => { const g = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 }); g.center(); return g })(),
        new THREE.MeshPhongMaterial({ color: 0xe8a0b4, emissive: 0x3a0018, transparent: true, opacity: 0.75 })
      )
      m.scale.setScalar(0.22)
      m.userData = { angle: (i / 4) * Math.PI * 2, speed: 0.009 + i * 0.002 }
      scene.add(m)
      return m
    })

    // Particules
    const pos = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) { pos[i*3]=(Math.random()-.5)*7; pos[i*3+1]=(Math.random()-.5)*7; pos[i*3+2]=(Math.random()-.5)*3 }
    const pgeo = new THREE.BufferGeometry()
    pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xe8a0b4, size: 0.04, transparent: true, opacity: 0.4 })))

    // Lumières
    scene.add(new THREE.AmbientLight(0xffeeff, 0.6))
    const l1 = new THREE.PointLight(0xff6699, 2, 10); l1.position.set(2, 2, 2); scene.add(l1)
    const l2 = new THREE.PointLight(0xb8a8e0, 1.5, 10); l2.position.set(-2, -1, 1); scene.add(l2)

    let f = 0, id
    const animate = () => {
      id = requestAnimationFrame(animate); f++
      const pulse = 1 + 0.04 * Math.sin(f * 0.06)
      heart.rotation.y = Math.sin(f * 0.01) * 0.4
      heart.rotation.x = Math.sin(f * 0.007) * 0.15
      heart.scale.setScalar(pulse)
      glow.scale.setScalar(pulse * 1.08)
      glow.rotation.copy(heart.rotation)
      minis.forEach(m => {
        m.userData.angle += m.userData.speed
        const { angle } = m.userData
        m.position.set(Math.cos(angle) * 1.6, Math.sin(angle * 0.5) * 0.4, Math.sin(angle) * 0.6)
        m.rotation.z = -angle + Math.PI
      })
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); el.removeChild(renderer.domElement); renderer.dispose() }
  }, [])

  return <div ref={ref} style={{ width: '100%', height: '220px' }} />
}
