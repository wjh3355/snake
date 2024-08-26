import { useState, useEffect, useRef } from "react";
import "./App.css";
import { random } from "lodash";

type SnakeDirType = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export default function App() {

   const gridSideLength = 25;
   const cellSideLength = 10;

   const initialSnake = [
      // FIRST VALUE IS HEAD OF SNAKE!!!
      [7, 25], [6, 25], [5, 25], [4, 25], [3, 25], [2, 25]
   ];
   
   const [snake, setSnake] = useState<number[][]>(initialSnake);

   const food = useRef<number[]>([]);

   const snakeDir = useRef<SnakeDirType>('RIGHT');

   const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
   const [showGameOverMsg, setShowGameOverMsg] = useState<boolean>(false);

   const [score, setScore] = useState<number>(0);

   useEffect(() => {
      let gameInterval: ReturnType<typeof setInterval> | undefined;
  
      if (isGameRunning) {
         gameInterval = setInterval(() => {
            console.log("SNAKE IS GOING:", snakeDir.current);
            tryToAdvanceSnake(); // Advance snake every 200ms
         }, 100);
      }
  
      return () => {
        if (gameInterval) clearInterval(gameInterval);
        console.log("CLEARING GAME INTERVAL");
      };
   }, [isGameRunning]);

   useEffect(() => {
      // This changes snakeDir.current whenever another arrow key is pressed, but the game cycle will always use the latest value of snakeDir.current

      function handleKeyPress(e: KeyboardEvent) {
         switch (e.key) {
            case "ArrowUp":
               if (snakeDir.current !== "DOWN") snakeDir.current = "UP";
               break;
            case "ArrowDown":
               if (snakeDir.current !== "UP") snakeDir.current = "DOWN";
               break;
            case "ArrowLeft":
               if (snakeDir.current !== "RIGHT") snakeDir.current = "LEFT";
               break;
            case "ArrowRight":
               if (snakeDir.current !== "LEFT") snakeDir.current = "RIGHT";
               break;
         }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
   }, []);
   
   const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridSideLength}, 1fr)`,
      gridTemplateRows: `repeat(${gridSideLength}, 1fr)`,
      width: `${gridSideLength*cellSideLength}px`,
      height: `${gridSideLength*cellSideLength}px`,
      border: '1px solid #e7e7e7',
      flex: 1
   };

   function generateGrid() {
      const grid = [];
      for (let y = gridSideLength; y > 0; y--) {
         for (let x = 1; x <= gridSideLength; x++) {
   
            let classToAdd = 'cell';
            if (snake.some(([snake_x, snake_y]) => snake_x === x && snake_y === y)) {
               classToAdd += ' snake';
            };

            const [food_x, food_y] = food.current;
            if (food_x === x && food_y === y) {
               classToAdd += ' food';
            };
   
            const el = (
               <div 
                  key={`${x}-${y}`}
                  className={classToAdd}
                  data-x={x}
                  data-y={y}
               ></div>
            );
            grid.push(el);
         };
      }
      return grid;
   };

   function tryToAdvanceSnake() {
      setSnake(previousSnake => {
         let [snakeHead_x, snakeHead_y] = previousSnake[0];

         switch (snakeDir.current) {
            case 'UP':
               snakeHead_y++;
               break;
            case 'DOWN':
               snakeHead_y--;
               break;
            case 'LEFT':
               snakeHead_x--;
               break;
            case 'RIGHT':
               snakeHead_x++;
               break;
         };

         const cellToAdvanceInto = [snakeHead_x, snakeHead_y];
         const snakeWithoutTailCell = previousSnake.slice(0, -1);

         const [food_x, food_y] = food.current;
         if (snakeHead_x === food_x && snakeHead_y === food_y) {
            // Snake eating food, so return
            food.current = generateNewFood();
            setScore(prev => prev + 1);
            console.log("FOOD EATEN: SCORE INCREASED");
            return [cellToAdvanceInto, ...previousSnake];
         };
   
         // Check if snake is advancing out of the grid:
         const isOutOfBounds = (
            snakeHead_x < 1 || snakeHead_x > gridSideLength
            || snakeHead_y < 1 || snakeHead_y > gridSideLength
         );

         // Check if snake is advancing into itself 
         // (tail doenst count since it moves out of the way anyway):
         const isCollidingWithSelf = (
            snakeWithoutTailCell.some(([x, y]) => x === snakeHead_x && y === snakeHead_y)
         );
   
         if (isOutOfBounds || isCollidingWithSelf) {
            setIsGameRunning(false);
            setShowGameOverMsg(true);
            console.log("GAME OVER!");
            return previousSnake;
         } else {
            return [cellToAdvanceInto, ...snakeWithoutTailCell];
         };
      });
   };

   function generateNewFood() {
      let food_x = random(1, gridSideLength);
      let food_y = random(1, gridSideLength);
      while (snake.some(([x, y]) => x === food_x && y === food_y)) {
         food_x = random(1, gridSideLength);
         food_y = random(1, gridSideLength);
      };
      return [food_x, food_y];
   };

   function startNewGame() {
      setIsGameRunning(true);
      setShowGameOverMsg(false);
      setSnake(initialSnake);
      snakeDir.current = "RIGHT";
      setScore(0);
      food.current = generateNewFood();
   }

   return (
      <>
         <div 
            style={gridStyle}
            className="grid">
            {generateGrid()}
         </div>

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
            {showGameOverMsg && 
               <h3 style={{color: "red"}}><strong>GAME OVER</strong></h3>
            }
         </div>
      </>
   );
}

