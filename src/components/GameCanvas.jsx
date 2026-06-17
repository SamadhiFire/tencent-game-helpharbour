import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import RescueScene from '../game/RescueScene.js';
import LevelTwoScene from '../game/LevelTwoScene.js';

export default function GameCanvas({ level }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return undefined;
    }

    const SceneClass = level?.id === 'level-2' ? LevelTwoScene : RescueScene;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 1600,
      height: 900,
      backgroundColor: '#101820',
      pixelArt: false,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [new SceneClass(level)],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [level]);

  return <section className="game-shell" ref={hostRef} aria-label={`${level.title} Phaser 场景`} />;
}
