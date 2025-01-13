<script>
	import { CANDIDATE_COORDS } from '@sudoku/constants';
	import { strategyManager } from '@sudoku/strategy/strategyManager';
	import { strategyGrid } from '@sudoku/stores/grid';

	export let candidates = [];
	export let gridRow;
	export let gridCol;

	function tryToSetCandidate(val) {
		if (!candidates.includes(val)) {
			return;
		}

		strategyGrid.increaseTimeStep();
		strategyManager.getIsUsingStrategy().set(false);
		strategyGrid.set({x: gridCol, y: gridRow}, val);
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