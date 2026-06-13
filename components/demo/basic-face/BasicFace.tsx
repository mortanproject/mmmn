/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

// Minimum volume level that indicates audio output is occurring
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;
const TALKING_STATE_COOLDOWN_MS = 200;

type BasicFaceProps = {
  /** The radius of the face (ignored for 3D avatar). */
  radius?: number;
  /** The color of the face. */
  color?: string;
};

export default function BasicFace({ color = '#00BFFF' }: BasicFaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { volume } = useLiveAPIContext();

  const isSpeakingRef = useRef(false);
  // Fix: Cannot find namespace 'NodeJS'. Use `ReturnType<typeof setTimeout>` for browser compatibility.
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (volume > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
      isSpeakingRef.current = true;
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      speakingTimeoutRef.current = setTimeout(() => {
        isSpeakingRef.current = false;
      }, TALKING_STATE_COOLDOWN_MS);
    }
  }, [volume]);

  useEffect(() => {
    const aiNetworkContainer = containerRef.current;
    if (!aiNetworkContainer) {
      return;
    }

    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      globeGroup: THREE.Group;
    let particles: THREE.Points, particleData: any[] = [];
    let eyesGroup: THREE.Group,
      leftEye: THREE.Mesh,
      rightEye: THREE.Mesh,
      mouthMesh: THREE.Mesh;
    let shootingStars: THREE.Points, shootingStarData: any[] = [];
    let shockwaves: any[] = [],
      MAX_SHOCKWAVES = 5;
    let raycaster: THREE.Raycaster, mouseVector: THREE.Vector2;
    let isMouseDown = false,
      mouseX = 0,
      mouseY = 0;
    let targetRotationX = 0.001,
      targetRotationY = 0.001;
    const clock = new THREE.Clock();
    let animationFrameId: number;
    const themeColor = new THREE.Color(color);

    function initGlobe() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        aiNetworkContainer.clientWidth / aiNetworkContainer.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 3.8;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(
        aiNetworkContainer.clientWidth,
        aiNetworkContainer.clientHeight
      );
      renderer.setPixelRatio(window.devicePixelRatio);
      aiNetworkContainer.appendChild(renderer.domElement);

      globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const globeRadius = 2.2;

      // Meridians and Parallels
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.2,
      });
      globeGroup.add(
        new THREE.LineSegments(
          new THREE.SphereGeometry(globeRadius, 24, 12),
          wireframeMaterial
        )
      );

      // AI Eyes
      eyesGroup = new THREE.Group();
      eyesGroup.position.y = 0.5;
      globeGroup.add(eyesGroup);

      const eyeGeometry = new THREE.SphereGeometry(0.38, 16, 12);
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.x = -0.8;
      rightEye.position.x = 0.8;

      const pupilMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a237e,
        blending: THREE.AdditiveBlending,
      });
      const leftPupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 8),
        pupilMaterial
      );
      const rightPupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 8),
        pupilMaterial
      );
      leftPupil.position.z = 0.35;
      rightPupil.position.z = 0.35;
      leftEye.add(leftPupil);
      rightEye.add(rightPupil);
      eyesGroup.add(leftEye);
      eyesGroup.add(rightEye);

      // AI Mouth
      const mouthShape = new THREE.Shape();
      const mouthWidth = 0.6;
      const mouthHeight = 0.25;
      mouthShape.moveTo(-mouthWidth / 2, 0);
      mouthShape.quadraticCurveTo(0, -mouthHeight, mouthWidth / 2, 0);
      mouthShape.quadraticCurveTo(0, -mouthHeight * 0.2, -mouthWidth / 2, 0);

      const mouthGeometry = new THREE.ShapeGeometry(mouthShape);
      const mouthMaterial = new THREE.MeshBasicMaterial({
        color: themeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      mouthMesh = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouthMesh.position.y = -0.75;
      globeGroup.add(mouthMesh);

      // Surface Particles
      const particleCount = 300;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        particleData.push({
          phi,
          theta,
          speed: (Math.random() - 0.5) * 0.015,
        });
        const [x, y, z] = sphericalToCartesian(globeRadius, phi, theta);
        particlePositions.set([x, y, z], i * 3);
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(particlePositions, 3)
      );
      const particleMaterial = new THREE.PointsMaterial({
        color: themeColor,
        size: 0.05,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
      });
      particles = new THREE.Points(particleGeometry, particleMaterial);
      globeGroup.add(particles);

      // Shooting Stars
      const starCount = 20;
      for (let i = 0; i < starCount; i++) {
        shootingStarData.push({
          progress: 1,
          start: new THREE.Vector3(),
          end: new THREE.Vector3(),
        });
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(starCount * 3), 3)
      );
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1.0,
      });
      shootingStars = new THREE.Points(starGeometry, starMaterial);
      globeGroup.add(shootingStars);

      // Click Shockwave
      raycaster = new THREE.Raycaster();
      mouseVector = new THREE.Vector2();
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        const shockwaveGeo = new THREE.RingGeometry(0.1, 0.2, 32);
        const shockwaveMat = new THREE.MeshBasicMaterial({
          color: themeColor,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        });
        const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
        shockwave.visible = false;
        globeGroup.add(shockwave);
        shockwaves.push({ mesh: shockwave, progress: 1 });
      }

      addEventListeners();
    }

    function addEventListeners() {
      aiNetworkContainer.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('resize', onWindowResize);
    }

    function removeEventListeners() {
      aiNetworkContainer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
    }

    function sphericalToCartesian(
      r: number,
      phi: number,
      theta: number
    ): [number, number, number] {
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      ];
    }

    function triggerShockwave(position: THREE.Vector3) {
      let shockwave = shockwaves.find(s => s.progress >= 1);
      if (!shockwave) shockwave = shockwaves.shift();
      shockwave.progress = 0;
      shockwave.mesh.visible = true;
      shockwave.mesh.position.copy(position);
      shockwave.mesh.lookAt(new THREE.Vector3(0, 0, 0));
      shockwaves.push(shockwave);
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.1;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.1;

      // Eye Animation
      const pulse = (Math.sin(elapsedTime * 1.5) + 1) / 2;
      leftEye.scale.setScalar(0.9 + pulse * 0.2);
      rightEye.scale.setScalar(0.9 + pulse * 0.2);
      eyesGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.3;
      eyesGroup.rotation.x = Math.cos(elapsedTime * 0.7) * 0.2;

      // Speaking Animation
      if (isSpeakingRef.current) {
        const speechPulse = 1.0 + Math.sin(elapsedTime * 20) * 0.2;
        mouthMesh.scale.y = speechPulse;
      } else {
        mouthMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      // Particle Animation
      const globeRadius = 2.2;
      const particlePositions =
        particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleData.length; i++) {
        particleData[i].theta += particleData[i].speed;
        const [x, y, z] = sphericalToCartesian(
          globeRadius,
          particleData[i].phi,
          particleData[i].theta
        );
        particlePositions.set([x, y, z], i * 3);
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Shooting Star Animation
      const starPositions =
        shootingStars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < shootingStarData.length; i++) {
        const star = shootingStarData[i];
        if (star.progress >= 1) {
          if (Math.random() < 0.005) {
            star.progress = 0;
            const startPhi = Math.random() * Math.PI;
            const startTheta = Math.random() * Math.PI * 2;
            star.start.fromArray(
              sphericalToCartesian(globeRadius, startPhi, startTheta)
            );
            star.end.fromArray(
              sphericalToCartesian(
                globeRadius,
                startPhi + Math.PI,
                startTheta + Math.PI
              )
            );
          }
        } else {
          star.progress += delta * 0.8;
          const currentPos = new THREE.Vector3().lerpVectors(
            star.start,
            star.end,
            star.progress
          );
          starPositions.set([currentPos.x, currentPos.y, currentPos.z], i * 3);
        }
      }
      shootingStars.geometry.attributes.position.needsUpdate = true;

      // Shockwave Animation
      shockwaves.forEach(s => {
        if (s.progress < 1) {
          s.progress += delta * 2.0;
          const easeProgress = s.progress * (2 - s.progress);
          s.mesh.scale.setScalar(easeProgress * 5);
          s.mesh.material.opacity = 1.0 - easeProgress;
        } else {
          s.mesh.visible = false;
        }
      });

      renderer.render(scene, camera);
    }

    function onMouseDown(event: MouseEvent) {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
      aiNetworkContainer.style.cursor = 'grabbing';

      const rect = renderer.domElement.getBoundingClientRect();
      mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects([particles]);
      if (intersects.length > 0) {
        triggerShockwave(intersects[0].point);
      }
    }

    function onMouseUp() {
      isMouseDown = false;
      aiNetworkContainer.style.cursor = 'grab';
    }

    function onMouseMove(event: MouseEvent) {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    }

    function onWindowResize() {
      if (!renderer || !camera || !aiNetworkContainer) return;
      const width = aiNetworkContainer.clientWidth;
      const height = aiNetworkContainer.clientHeight;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }

    initGlobe();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      removeEventListeners();
      if (renderer) {
        aiNetworkContainer.removeChild(renderer.domElement);
        renderer.dispose();
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [color]);

  return <div ref={containerRef} id="ai-globe-container" />;
}
