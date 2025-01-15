<script>
	import { CANDIDATE_COORDS } from '@sudoku/constants';
	import { strategyManager } from '@sudoku/strategy/strategyManager';
	import { strategyGrid } from '@sudoku/stores/grid';
	import { branchBackManager } from '@sudoku/branch/branchBackManager';
	import {get} from 'svelte/store';

	export let candidates = [];
	export let gridRow;
	export let gridCol;

	function tryToSetCandidate(val) {
		if (!candidates.includes(val)) {
			return;
		}

		// update strategy grid state
		strategyGrid.increaseTimeStep();
		strategyManager.getIsUsingStrategy().set(false);
		get(strategyGrid.getStrategyGrid()).map(row => row.map(cell => { cell.resetRelativePos(); cell.resetStrategies(); }));
		strategyGrid.set({x: gridCol, y: gridRow}, val);
		strategyGrid.updateCellCandidates();

		// Update branch back times
		branchBackManager.getBranchBackTimes().update(val => val + 1);
	}
</script>

<div class="candidate-grid">
	{#each CANDIDATE_COORDS as [row, col], index}
		<button class="candidate row-start-{row} col-start-{col}"
		     class:invisible={!candidates.includes(index + 1)}
		     class:visible={candidates.includes(index + 1)}
			 on:click={() => tryToSetCandidate(index + 1)}
		>
			{index + 1}
		</button>
	{/each}
</div>

<style>
	.candidate-grid {
		@apply grid h-full w-full p-1;
	}

	.candidate {
		@apply h-full w-full row-end-auto col-end-auto leading-full;
	}
</style>