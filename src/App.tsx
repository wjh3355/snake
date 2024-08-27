import { useState, useEffect, useRef } from "react";
import { random, floor } from "lodash";
import { Grid, Cell } from "./StyledComps";
import { SnakeArrayType, SnakeDirType, coords } from "./types";

const gridSideLength = 35
;
const cellSideLength = 10;

const initialSnakeLength = 5;
const initialSnake: SnakeArrayType = getInitialSnake();

function getInitialSnake() {
   const arr: SnakeArrayType = [];
   const y = floor(gridSideLength / 2);
   for (let x = initialSnakeLength + 1; x > 1; x--) {
      arr.push([x, y]);
   };
   return arr;
}


const gameTick = 120;

export default function App() {

   const [snake, setSnake] = useState<SnakeArrayType>(initialSnake);

   const food = useRef<coords>([NaN, NaN]);

   const snakeDir = useRef<SnakeDirType>('RIGHT');

   const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
   const [showGameOverMsg, setShowGameOverMsg] = useState<boolean>(false);

   const [score, setScore] = useState<number>(0);

   useEffect(() => {
      // GAME LOOP

      let gameInterval: ReturnType<typeof setInterval> | undefined;
  
      if (isGameRunning) {
         gameInterval = setInterval(() => {
            tryToAdvanceSnake();
         }, gameTick);
      }
  
      return () => {
         if (gameInterval) clearInterval(gameInterval);
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

   function generateGrid() {
      const grid = [];
      for (let y = gridSideLength; y > 0; y--) {
         for (let x = 1; x <= gridSideLength; x++) {
   
            const isPartOfSnake = snake.some(([snake_x, snake_y]) => snake_x === x && snake_y === y);

            const [food_x, food_y] = food.current;
            const isFood = (food_x === x && food_y === y);
   
            grid.push(
               <Cell
                  key={`${x}-${y}`}
                  $snake={isPartOfSnake}
                  $food={isFood}
               ></Cell>
            );
         };
      }
      return grid;
   };

   function tryToAdvanceSnake() {
      // Changes 'snake' state.
      setSnake(previousSnake => {
         console.log("ADVANCING", snakeDir.current);
         let newSnake: SnakeArrayType;
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
            return newSnake;
         } else {
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
               // Game ends
               setIsGameRunning(false);
               setShowGameOverMsg(true);
               console.log("GAME OVER!");
               return previousSnake;
            } else {
               // Game continues
               newSnake = [cellToAdvanceInto, ...snakeWithoutTailCell]
               return newSnake;
            };
         };
      });
   };

   function generateNewFood(snakeArray: SnakeArrayType): coords {
      let food_x: number, food_y: number;
      do {
         food_x = random(1, gridSideLength);
         food_y = random(1, gridSideLength);
      } while (snakeArray.some(([x, y]) => x === food_x && y === food_y));
      return [food_x, food_y];
   };

   function startNewGame() {
      setIsGameRunning(true);
      setShowGameOverMsg(false);
      setSnake(initialSnake);
      snakeDir.current = "RIGHT";
      setScore(0);
      food.current = generateNewFood(initialSnake);
   };

   return (
      <>
         <Grid
            $gridSideLength={gridSideLength}
            $cellSideLength={cellSideLength}
         >
            {generateGrid()}
         </Grid>

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
         <br/>
         <div>Food is at: [{food.current.join(', ')}]</div>
         <div>Snake length: {snake.length}</div>
      </>
   );
}

