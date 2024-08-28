import { useState, useEffect, useRef } from "react";
import { random, floor } from "lodash";
import { SnakeArrayType, SnakeDirType, coords } from "./types";


export default function App() {
   const [gridSideLength, setGridSideLength] = useState<number>(49);
   const [cellSideLength, setCellSideLength] = useState<number>(10);
   const [initialSnakeLength, setInitialSnakeLength] = useState<number>(3);
   const [gameTick, setGameTick] = useState<number>(100);
   
   function genInitSnake(gridSize: number, snakeLength: number) {
      const arr: SnakeArrayType = [];
      const y = floor(gridSize / 2);
      for (let x = snakeLength; x > 0; x--) {
         arr.push([x, y]);
      };
      return arr;
   };

   const [pendGridSideLength, setPendGridSideLength] = useState<number>(49);
   const [pendCellSideLength, setPendCellSideLength] = useState<number>(10);
   const [pendInitSnakeLength, setPendInitSnakeLength] = useState<number>(3);
   const [pendGameTick, setPendGameTick] = useState<number>(100);

   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const snakeDir = useRef<SnakeDirType>("RIGHT");
   const food = useRef<coords>([NaN, NaN]);
   const score = useRef<number>(0);

   const [snake, setSnake] = useState<SnakeArrayType>(
      () => genInitSnake(gridSideLength, initialSnakeLength)
   );
   const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
   const [showGameOverMsg, setShowGameOverMsg] = useState<boolean>(false);

   useEffect(() => {
      console.log("Drawing canvas");
      drawCanvas();
   }, [snake]);

   useEffect(() => {
      // GAME LOOP
      let gameInterval: ReturnType<typeof setInterval> | undefined;
      
      if (isGameRunning) {
         console.log("Game loop started");
         gameInterval = setInterval(() => {
            console.log("SNAKE MOVING:", snakeDir.current);
            tryToAdvanceSnake();
         }, gameTick);
      };

      return () => {
         if (gameInterval) clearInterval(gameInterval);
         console.log("Game loop cleared");
      };
   }, [isGameRunning]);

   useEffect(() => {
      // This changes snakeDir.current whenever another arrow key is pressed, but the game cycle will always use the latest value of snakeDir.current
      function handleKeyPress(e: KeyboardEvent) {
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
      }
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
   }, []);

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
               snakeHead_x === gridSideLength ||
               snakeHead_y < 0 ||
               snakeHead_y === gridSideLength;
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
               return newSnake;
            }
         }
      });
   }

   function generateNewFood(snakeArray: SnakeArrayType): coords {
      let food_x: number, food_y: number;
      do {
         food_x = random(0, gridSideLength - 1);
         food_y = random(0, gridSideLength - 1);
      } while (snakeArray.some(([x, y]) => x === food_x && y === food_y));
      return [food_x, food_y];
   };

   function startNewGame() {
      setShowGameOverMsg(false);
      setSnake(genInitSnake(gridSideLength, initialSnakeLength));
      score.current = 0;
      snakeDir.current = "RIGHT";
      food.current = generateNewFood(snake);
      
      setIsGameRunning(true);
   };
   
   function applySettings() {
      setGridSideLength(pendGridSideLength);
      setCellSideLength(pendCellSideLength);
      setInitialSnakeLength(pendInitSnakeLength);
      setGameTick(pendGameTick);

      setShowGameOverMsg(false);
      score.current = 0;
      snakeDir.current = "RIGHT";
      food.current = [NaN, NaN];
      setSnake(genInitSnake(pendGridSideLength, pendInitSnakeLength));
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
      for (let i = 0; i <= gridSideLength; i++) {
         const pos = i * cellSideLength;
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
            snakeCell_x * cellSideLength,
            snakeCell_y * cellSideLength,
            cellSideLength,
            cellSideLength
         );
      });

      // DRAW FOOD (CIRCULAR)
      ctx.fillStyle = "brown";
      const [food_x, food_y] = food.current;
      const r = floor(cellSideLength / 2);
      const cent_x = food_x * cellSideLength + r;
      const cent_y = food_y * cellSideLength + r;
      ctx.beginPath();
      ctx.arc(cent_x, cent_y, r, 0, Math.PI * 2);
      ctx.fill();
   };

   return (
      <>
         <canvas
            width={gridSideLength * cellSideLength}
            height={gridSideLength * cellSideLength}
            style={{ border: "1px solid black" }}
            ref={canvasRef}
         ></canvas>

         <div>
            <div style={{ marginTop: "10px" }}>
               <button onClick={startNewGame} disabled={isGameRunning} style={{fontSize: "18px", padding:"5px"}}>
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

            <br />
         </div>

         <div>Food at: [{food.current.join(", ")}]</div>
         <div>Snake length: {snake.length}</div>
         <div>Snake facing: {snakeDir.current}</div>
         <div>
            (Use WASD to change direction)
         </div>

         <br />
         <br />



         <h3>Settings:</h3>
         <div>
            <label>
               Grid side length:&nbsp;
               <input
                  type="number"
                  value={pendGridSideLength}
                  onChange={(e) => setPendGridSideLength(Number(e.target.value))}
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
                  value={pendCellSideLength}
                  onChange={(e) => setPendCellSideLength(Number(e.target.value))}
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
                  value={pendInitSnakeLength}
                  onChange={(e) =>
                     setPendInitSnakeLength(Number(e.target.value))
                  }
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
                  value={pendGameTick}
                  onChange={(e) => setPendGameTick(Number(e.target.value))}
                  min="50"
                  max="300"
                  step="10"
                  disabled={isGameRunning}
               />
            </label>
         </div>
         <div>
            <button onClick={applySettings} disabled={isGameRunning}>
               Apply
            </button>
         </div>
      </>
   );
}

