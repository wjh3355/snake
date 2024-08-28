import { useState, useEffect, useRef } from "react";
import { random, floor } from "lodash";
import { SnakeArrayType, SnakeDirType, coords } from "./types";

const gridSideLength = 35;

const cellSideLength = 10;

const initialSnakeLength = 3;

const initialSnake: SnakeArrayType = (() => {
   const arr: SnakeArrayType = [];
   const y = floor(gridSideLength / 2);
   for (let x = initialSnakeLength; x > 0; x--) {
      arr.push([x, y]);
   };
   return arr;
})();

const gameTick = 120;

export default function App() {

   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const snake = useRef<SnakeArrayType>(initialSnake);
   const food = useRef<coords>([NaN, NaN]);
   const snakeDir = useRef<SnakeDirType>('RIGHT');

   const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
   const [showGameOverMsg, setShowGameOverMsg] = useState<boolean>(false);
   const [score, setScore] = useState<number>(0);

   useEffect(() => {drawCanvas()}, []);

   useEffect(() => {
      // GAME LOOP
      let gameInterval: ReturnType<typeof setInterval> | undefined;

      if (isGameRunning) {
         gameInterval = setInterval(() => {
            tryToAdvanceSnake();
            drawCanvas();
         }, gameTick);
      }
  
      return () => {
         if (gameInterval) clearInterval(gameInterval);
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
      };
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
   }, []);

   function tryToAdvanceSnake() {
      const previousSnake = snake.current;
      console.log("ADVANCING", snakeDir.current);
      let newSnake: SnakeArrayType;
      let [snakeHead_x, snakeHead_y] = previousSnake[0];

      switch (snakeDir.current) {
         case 'UP':
            snakeHead_y--;
            break;
         case 'DOWN':
            snakeHead_y++;
            break;
         case 'LEFT':
            snakeHead_x--;
            break;
         case 'RIGHT':
            snakeHead_x++;
            break;
      };

      const cellToAdvanceInto: coords = [snakeHead_x, snakeHead_y];
      const snakeWithoutTailCell = previousSnake.slice(0, -1);

      const [food_x, food_y] = food.current;
      if (snakeHead_x === food_x && snakeHead_y === food_y) {
         // Snake eating food
         // Length must increase
         // Another food placed elsewhere
         newSnake = [cellToAdvanceInto, ...previousSnake];
         food.current = generateNewFood(newSnake);
         setScore(prev => prev + 1);
         console.log("FOOD EATEN: SCORE INCREASED");
         snake.current = newSnake;
      } else {
         // Check if snake is advancing out of the grid:
         const isOutOfBounds = (
            snakeHead_x < 0 || snakeHead_x === gridSideLength
            || snakeHead_y < 0 || snakeHead_y === gridSideLength
         );
         // Check if snake is advancing into itself 
         // (tail doenst count since it moves out of the way anyway):
         const isCollidingWithSelf = (
            snakeWithoutTailCell.some(([x, y]) => x === snakeHead_x && y === snakeHead_y)
         );
         if (isOutOfBounds || isCollidingWithSelf) {
            // Game ends
            setIsGameRunning(false);
            setShowGameOverMsg(true);
            console.log("GAME OVER!");
         } else {
            // Game continues
            newSnake = [cellToAdvanceInto, ...snakeWithoutTailCell];
            snake.current = newSnake;
         };
      };
   };

   function generateNewFood(snakeArray: SnakeArrayType): coords {
      let food_x: number, food_y: number;
      do {
         food_x = random(0, gridSideLength-1);
         food_y = random(0, gridSideLength-1);
      } while (snakeArray.some(([x, y]) => x === food_x && y === food_y));
      return [food_x, food_y];
   };

   function startNewGame() {
      setIsGameRunning(true);
      setShowGameOverMsg(false);
      snake.current = initialSnake;
      snakeDir.current = "RIGHT";
      setScore(0);
      food.current = generateNewFood(initialSnake);
   };

   function drawCanvas() {
      // console.log("DRAWING CANVAS");
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // DRAW GRID
      ctx.strokeStyle = "lightgray";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= gridSideLength; i++) {
         const pos = i * cellSideLength;
         ctx.moveTo(pos, 0);
         ctx.lineTo(pos, canvas.height);
         ctx.moveTo(0, pos);
         ctx.lineTo(canvas.width, pos);
      };
      ctx.stroke();
      
      ctx.fillStyle = "black";

      snake.current.forEach(([snakeCell_x, snakeCell_y]) => {
         ctx.fillRect(
            snakeCell_x * cellSideLength,
            snakeCell_y * cellSideLength,
            cellSideLength,
            cellSideLength
         );
      });

      ctx.fillStyle = "red";

      const [food_x, food_y] = food.current;
      ctx.fillRect(
         food_x * cellSideLength,
         food_y * cellSideLength,
         cellSideLength,
         cellSideLength
      );
   };

   return (
      <>
         <canvas
            width={gridSideLength*cellSideLength}
            height={gridSideLength*cellSideLength}
            style={{border: "1px solid black"}}
            ref={canvasRef}
         ></canvas>

         <div>

            <div
               style={{fontSize: "15px", marginTop: "10px"}}
            >
               <button
                  onClick={startNewGame}
                  disabled={isGameRunning}
               >
                  {isGameRunning ? "End Game" : "Start Game"}
               </button>
               &nbsp;&nbsp;
               Score: {score}
            </div>

            <br/>

            {showGameOverMsg && 
               <h3 style={{color: "red", margin: "0"}}><strong>GAME OVER</strong></h3>
            }

            <br/>

         </div>
         
         <div>Food is at: [{food.current.join(', ')}]</div>
         <div>Snake length: {snake.current.length}</div>
         <div>Snake is moving: {snakeDir.current}</div>
         <div>(Use WASD to change direction)</div>
      </>
   );
}

