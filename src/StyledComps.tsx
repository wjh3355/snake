import styled from "styled-components";

type GridProps = { gridSideLength: number; cellSideLength: number };
type CellProps = { snake: boolean; food: boolean };

export const Grid = styled.div<GridProps>`
   --gridTotalWidthPx: ${props =>
      props.gridSideLength * props.cellSideLength}px;
   --gridSideLength: ${props => props.gridSideLength};

   width: var(--gridTotalWidthPx);
   height: var(--gridTotalWidthPx);
   border: 1px solid #e7e7e7;

   display: grid;
   grid-template-columns: repeat(var(--gridSideLength), 1fr);
   grid-template-rows: repeat(var(--gridSideLength), 1fr);
`;

export const Cell = styled.div<CellProps>`
   border: 1px solid #e7e7e7;

   background-color: ${props => {
      if (props.snake) return "rgb(0, 0, 0)";
      if (props.food) return "rgb(163, 47, 47)";
      return "white";
   }};
`;
