import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import RescueScene from '../game/RescueScene.js';

export default function GameCanvas({ level }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return undefined;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 1120,
      height: 700,
      backgroundColor: '#f7ead6',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [new RescueScene(level)],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [level]);

  return <section className="game-shell" ref={hostRef} aria-label={`${level.title} Phaser 场景`} />;
}
