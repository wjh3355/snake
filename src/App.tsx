import { useState, useEffect, useRef } from "react";
import { random, floor } from "lodash";
import styled from "styled-components";

type SnakeDirType = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
type coords = [number, number];
type SnakeArrayType = coords[];
type SettingsType = {
   pendGridSideLen: number,
   pendCellPxLen: number,
   pendInitSnakeLen: number,
   pendGameTick: number
};

const defaultSettings: SettingsType = {
   pendGridSideLen: 49,
   pendCellPxLen: 10,
   pendInitSnakeLen: 3,
   pendGameTick: 100
};

const ButtonContainer = styled.div`
   float: right;
   display: grid;
   grid-template-columns: repeat(3, 1fr);
   grid-template-rows: repeat(3, 1fr);
   gap: 5px;
   width: 180px;
   margin-top: 20px;
`;

const ArrowButton = styled.button`
   width: 45px;
   height: 45px;
   font-size: 24px;
   display: flex;
   justify-content: center;
   align-items: center;
   background-color: #f0f0f0;
   border-radius: 5px;
   &:active {
      background-color: ${props => !props.disabled && '#d3d3d3'};
   }
`;

export default function App() {
   const [gridSideLen, setGridSideLen] = useState<number>(49);
   const [cellPxLen, setCellPxLen] = useState<number>(10);
   const [initSnakeLen, setInitSnakeLen] = useState<number>(3);
   const [gameTick, setGameTick] = useState<number>(100);
   
   function genInitSnake(gridSize: number, snakeLength: number) {
      const arr: SnakeArrayType = [];
      const y = floor(gridSize / 2);
      for (let x = snakeLength; x > 0; x--) {
         arr.push([x, y]);
      };
      return arr;
   };

   const [pendingSettings, setPendingSettings] = useState<SettingsType>(defaultSettings);

   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const snakeDir = useRef<SnakeDirType>("RIGHT");
   const food = useRef<coords>([NaN, NaN]);
   const score = useRef<number>(0);

   const [snake, setSnake] = useState<SnakeArrayType>(
      () => genInitSnake(gridSideLen, initSnakeLen)
   );
   const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
   const [showGameOverMsg, setShowGameOverMsg] = useState<boolean>(false);

   useEffect(() => {
      console.log("Updating canvas");
      drawCanvas();
   }, [snake]);

   useEffect(() => {
      // GAME LOOP
      let gameInterval: ReturnType<typeof setInterval> | undefined;
      
      if (isGameRunning) {
         console.log("Starting game loop");
         gameInterval = setInterval(() => {
            tryToAdvanceSnake();
         }, gameTick);
      };

      return () => {
         if (gameInterval) {
            clearInterval(gameInterval);
            console.log("Ending game loop");
         }
      };
   }, [isGameRunning]);

   useEffect(() => {
      window.addEventListener("keydown", handleWASDKeyPress);
      return () => window.removeEventListener("keydown", handleWASDKeyPress);
   }, []);

   // This changes snakeDir.current whenever another arrow key is pressed
   // but the game cycle will always use the latest value of snakeDir.current
   function handleWASDKeyPress(e: KeyboardEvent) {
      switch (e.key.toLowerCase()) {
         case "w":
            if (snakeDir.current !== "DOWN") snakeDir.current = "UP";
            break;
         case "s":
            if (snakeDir.current !== "UP") snakeDir.current = "DOWN";
            break;
         case "a":
            if (snakeDir.current !== "RIGHT") snakeDir.current = "LEFT";
            break;
         case "d":
            if (snakeDir.current !== "LEFT") snakeDir.current = "RIGHT";
            break;
      }
   };

   // Same but for the physical buttons
   function handleArrowButtonPress(newDir: SnakeDirType) {
      switch (newDir) {
         case "UP":
            if (snakeDir.current !== "DOWN") snakeDir.current = "UP";
            break;
         case "DOWN":
            if (snakeDir.current !== "UP") snakeDir.current = "DOWN";
            break;
         case "LEFT":
            if (snakeDir.current !== "RIGHT") snakeDir.current = "LEFT";
            break;
         case "RIGHT":
            if (snakeDir.current !== "LEFT") snakeDir.current = "RIGHT";
            break;
      }
   };

   function tryToAdvanceSnake() {
      setSnake(prevSnake => {
         let newSnake: SnakeArrayType;
         let [snakeHead_x, snakeHead_y] = prevSnake[0];

         switch (snakeDir.current) {
            case "UP":
               snakeHead_y--;
               break;
            case "DOWN":
               snakeHead_y++;
               break;
            case "LEFT":
               snakeHead_x--;
               break;
            case "RIGHT":
               snakeHead_x++;
               break;
         };

         const newHeadCell: coords = [snakeHead_x, snakeHead_y];
         const snakeWithoutTailCell = prevSnake.slice(0, -1);

         const [food_x, food_y] = food.current;
         if (snakeHead_x === food_x && snakeHead_y === food_y) {
            // Snake eating food
            // Length must increase
            // Another food placed elsewhere
            newSnake = [newHeadCell, ...prevSnake];
            food.current = generateNewFood(newSnake);
            score.current++;
            console.log("FOOD EATEN");
            return newSnake;
         } else {
            // Check if snake is advancing out of the grid:
            const isOutOfBounds =
               snakeHead_x < 0 ||
               snakeHead_x === gridSideLen ||
               snakeHead_y < 0 ||
               snakeHead_y === gridSideLen;
            // Check if snake is advancing into itself
            // (tail doenst count since it moves out of the way anyway):
            const isCollidingWithSelf = snakeWithoutTailCell.some(
               ([x, y]) => x === snakeHead_x && y === snakeHead_y
            );
            if (isOutOfBounds || isCollidingWithSelf) {
               // Game ends
               setIsGameRunning(false);
               setShowGameOverMsg(true);
               console.log("GAME OVER!");
               return prevSnake;
            } else {
               // Game continues
               newSnake = [newHeadCell, ...snakeWithoutTailCell];
               console.log("SNAKE IS MOVING: ", snakeDir.current);
               return newSnake;
            }
         }
      });
   }

   function generateNewFood(snakeArray: SnakeArrayType): coords {
      let food_x: number, food_y: number;
      do {
         food_x = random(0, gridSideLen - 1);
         food_y = random(0, gridSideLen - 1);
      } while (snakeArray.some(([x, y]) => x === food_x && y === food_y));
      return [food_x, food_y];
   };

   function startNewGame() {
      setShowGameOverMsg(false);
      setSnake(genInitSnake(gridSideLen, initSnakeLen));
      score.current = 0;
      snakeDir.current = "RIGHT";
      food.current = generateNewFood(snake);
      
      setIsGameRunning(true);
   };
   
   function applySettings() {
      const { pendGridSideLen,
         pendCellPxLen,
         pendInitSnakeLen,
         pendGameTick } = pendingSettings;

      setGridSideLen(pendGridSideLen);
      setCellPxLen(pendCellPxLen);
      setInitSnakeLen(pendInitSnakeLen);
      setGameTick(pendGameTick);

      setShowGameOverMsg(false);
      score.current = 0;
      snakeDir.current = "RIGHT";
      food.current = [NaN, NaN];
      setSnake(genInitSnake(pendGridSideLen, pendInitSnakeLen));
   };

   function drawCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // DRAW GRID
      ctx.strokeStyle = "rgb(220, 220, 220)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= gridSideLen; i++) {
         const pos = i * cellPxLen;
         ctx.moveTo(pos, 0);
         ctx.lineTo(pos, canvas.height);
         ctx.moveTo(0, pos);
         ctx.lineTo(canvas.width, pos);
      }
      ctx.stroke();

      // DRAW SNAKE
      ctx.fillStyle = "black";
      snake.forEach(([snakeCell_x, snakeCell_y]) => {
         ctx.fillRect(
            snakeCell_x * cellPxLen,
            snakeCell_y * cellPxLen,
            cellPxLen,
            cellPxLen
         );
      });

      // DRAW FOOD (CIRCULAR)
      ctx.fillStyle = "brown";
      const [food_x, food_y] = food.current;
      const r = floor(cellPxLen / 2);
      const cent_x = food_x * cellPxLen + r;
      const cent_y = food_y * cellPxLen + r;
      ctx.beginPath();
      ctx.arc(cent_x, cent_y, r, 0, Math.PI * 2);
      ctx.fill();
   };

   return (
      <>
         <canvas
            width={gridSideLen * cellPxLen}
            height={gridSideLen * cellPxLen}
            style={{ border: "1px solid black" }}
            ref={canvasRef}
         ></canvas>

         <ButtonContainer>
            <div></div>
            <ArrowButton
               onClick={() => handleArrowButtonPress("UP")}
               disabled={!isGameRunning}
            >▲</ArrowButton>
            <div></div>
            <ArrowButton
               onClick={() => handleArrowButtonPress("LEFT")}
               disabled={!isGameRunning}
            >◀</ArrowButton>
            <div></div>
            <ArrowButton
               onClick={() => handleArrowButtonPress("RIGHT")}
               disabled={!isGameRunning}
            >▶</ArrowButton>
            <div></div>
            <ArrowButton
               onClick={() => handleArrowButtonPress("DOWN")}
               disabled={!isGameRunning}
            >▼</ArrowButton>
            <div></div>
         </ButtonContainer>

         <div>
            <div style={{ marginTop: "10px" }}>
               <button
                  onClick={startNewGame}
                  disabled={isGameRunning}
                  style={{ fontSize: "18px", padding: "5px" }}
               >
                  Play
               </button>
               &nbsp;&nbsp; Score: {score.current}
            </div>

            <br />

            {showGameOverMsg && (
               <h3 style={{ color: "red", margin: "0" }}>
                  <strong>Game Over!</strong>
               </h3>
            )}
         </div>

         <h3 style={{clear: 'both'}}>Settings:</h3>
         <div>
            <label>
               Grid side length:&nbsp;
               <input
                  type="number"
                  value={pendingSettings.pendGridSideLen}
                  onChange={e => setPendingSettings(prev => {
                     return {...prev, pendGridSideLen: Number(e.target.value)}
                  })}
                  min="15"
                  max="99"
                  step="1"
                  disabled={isGameRunning}
               />
            </label>
         </div>
         <div>
            <label>
               Cell side length:&nbsp;
               <input
                  type="number"
                  value={pendingSettings.pendCellPxLen}
                  onChange={e => setPendingSettings(prev => {
                     return {...prev, pendCellPxLen: Number(e.target.value)}
                  })}
                  min="5"
                  max="20"
                  step="1"
                  disabled={isGameRunning}
               />
            </label>
         </div>
         <div>
            <label>
               Initial snake length:&nbsp;
               <input
                  type="number"
                  value={pendingSettings.pendInitSnakeLen}
                  onChange={e => setPendingSettings(prev => {
                     return {...prev, pendInitSnakeLen: Number(e.target.value)}
                  })}
                  min="3"
                  max="5"
                  step="1"
                  disabled={isGameRunning}
               />
            </label>
         </div>
         <div>
            <label>
               Game tick:&nbsp;
               <input
                  type="number"
                  value={pendingSettings.pendGameTick}
                  onChange={e => setPendingSettings(prev => {
                     return {...prev, pendGameTick: Number(e.target.value)}
                  })}
                  min="50"
                  max="500"
                  step="50"
                  disabled={isGameRunning}
               />
            </label>
         </div>
         <div style={{marginTop: "10px"}}>
            <button onClick={applySettings} disabled={isGameRunning}>
               Apply
            </button>
            &nbsp;&nbsp;
            <button onClick={() => setPendingSettings(defaultSettings)} disabled={isGameRunning}>
               Reset
            </button>
         </div>
         
         <br/>

         <div>Food at: [{food.current.join(", ")}]</div>
         <div>Snake length: {snake.length}</div>
         <div>Snake facing: {snakeDir.current}</div>
         <div>(On computer, use WASD to change direction)</div>
      </>
   );
}