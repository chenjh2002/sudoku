<script>
	import { BOX_SIZE, SUDOKU_SIZE } from '@sudoku/constants';
	import { gamePaused } from '@sudoku/stores/game';
	import { grid, userGrid, invalidCells, strategyGrid } from '@sudoku/stores/grid';
	import { settings } from '@sudoku/stores/settings';
	import { cursor } from '@sudoku/stores/cursor';
	import { candidates } from '@sudoku/stores/candidates';
	import { strategyManager } from '@sudoku/strategy/strategyManager';
	import Cell from './Cell.svelte';

	$: isUsingStrategy = strategyManager.getIsUsingStrategy();

	function isSelected(cursorStore, x, y) {
		return cursorStore.x === x && cursorStore.y === y;
	}

	function isSameArea(cursorStore, x, y) {
		if (cursorStore.x === null && cursorStore.y === null) return false;
		if (cursorStore.x === x || cursorStore.y === y) return true;

		const cursorBoxX = Math.floor(cursorStore.x / BOX_SIZE);
		const cursorBoxY = Math.floor(cursorStore.y / BOX_SIZE);
		const cellBoxX = Math.floor(x / BOX_SIZE);
		const cellBoxY = Math.floor(y / BOX_SIZE);
		return (cursorBoxX === cellBoxX && cursorBoxY === cellBoxY);
	}

	function getValueAtCursor(gridStore, cursorStore) {
		if (cursorStore.x === null && cursorStore.y === null) return null;

		return gridStore[cursorStore.y][cursorStore.x];
	}

	function isStrategyCell(isUsingStrategy, strategyGridStore, y, x) {
		if (x === null || y === null) return false;
		return isUsingStrategy &&
				strategyGridStore[y][x].isUserCell() &&
				strategyGridStore[y][x].strategies != null &&
				strategyGridStore[y][x].strategies.length > 0;
	}

	function isRelativeCell(isUsingStrategy, strategyGridStore, cursorStore, y, x) {
		return 	cursorStore.x !== null && cursorStore.y !== null &&
				isStrategyCell(isUsingStrategy, strategyGridStore, cursorStore.y, cursorStore.x) &&
				strategyGridStore[cursorStore.y][cursorStore.x].relativePos !== null &&
				strategyGridStore[cursorStore.y][cursorStore.x].relativePos.some(cell => cell.x === x && cell.y === y);
	}

	function isInValidateCandidate(strategyGridStore, y, x) {
		if (!(strategyGridStore[y][x].isUserCell() && strategyGridStore[y][x].explore !== 0)) return false;

		if (strategyGridStore[y][x].isUserCell() && strategyGridStore[y][x].candidates.length === 0) return true;

		// Check for row
		for (let col = 0; col < SUDOKU_SIZE; col++) {
			if (strategyGridStore[y][col].isCellConstant() && strategyGridStore[y][col].getCurrentCell() === strategyGridStore[y][x].explore && col !== x)
				return true;
		}

		// Check for col
		for (let row = 0; row < SUDOKU_SIZE; row++) {
			if (strategyGridStore[row][x].isCellConstant() && strategyGridStore[row][x].getCurrentCell() === strategyGridStore[y][x].explore && row !== y)
				return true;
		}

		// Check for box
		const startRow = Math.floor(y / BOX_SIZE) * BOX_SIZE;
		const startCol = Math.floor(x / BOX_SIZE) * BOX_SIZE;
		for (let i = startRow; i < startRow + BOX_SIZE; i++) {
			for (let j = startCol; j < startCol +BOX_SIZE; j++) {
				if (i !== y && j !== x && strategyGridStore[i][j].isCellConstant() && strategyGridStore[i][j].getCurrentCell() === strategyGridStore[y][x].explore) {
					return true;
				}
			}
		}

		return false;
	}
</script>

<div class="board-padding relative z-10">
	<div class="max-w-xl relative">
		<div class="w-full" style="padding-top: 100%"></div>
	</div>
	<div class="board-padding absolute inset-0 flex justify-center">

		<div class="bg-white shadow-2xl rounded-xl overflow-hidden w-full h-full max-w-xl grid" class:bg-gray-200={$gamePaused}>

			{#each $grid as row, y}
				{#each row as value, x}
					<Cell {value}
					      cellY={y + 1}
					      cellX={x + 1}
					      candidates={$strategyGrid[y][x].candidates}
						  explore={$strategyGrid[y][x].explore}
					      disabled={$gamePaused}
					      selected={isSelected($cursor, x, y)}
					      userNumber={$grid[y][x] === 0}
					      sameArea={$settings.highlightCells && !isSelected($cursor, x, y) && isSameArea($cursor, x, y)}
					      sameNumber={$settings.highlightSame && value && !isSelected($cursor, x, y) && getValueAtCursor($userGrid, $cursor) === value}
					      conflictingNumber={$settings.highlightConflicting && $grid[y][x] === 0 && $strategyGrid[y][x].explore !== 0 && !$strategyGrid[y][x].candidates.includes($strategyGrid[y][x].explore)}
						  strategyCell={isStrategyCell($isUsingStrategy, $strategyGrid, y, x)}
						  relativeCell={isRelativeCell($isUsingStrategy, $strategyGrid, $cursor, y, x)}
						  invalidCandidate={isInValidateCandidate($strategyGrid, y, x)}
					/>
				{/each}
			{/each}

		</div>

	</div>
</div>

<style>
	.board-padding {
		@apply px-4 pb-4;
	}
</style>