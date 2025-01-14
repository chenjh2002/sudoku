<script>
    import { strategyGrid } from '@sudoku/stores/grid';
    import { strategyManager } from '@sudoku/strategy/strategyManager';
    import { cursor } from '@sudoku/stores/cursor';

    $: isUsingStrategy = strategyManager.getIsUsingStrategy();

    function isStrategyCell(isUsingStrategy, strategyGridStore, cursorStore) {
      if (cursorStore.x === null || cursorStore.y === null) return false;
      return isUsingStrategy &&
          strategyGridStore[cursorStore.y][cursorStore.x].isUserCell() &&
          strategyGridStore[cursorStore.y][cursorStore.x].strategies != null &&
          strategyGridStore[cursorStore.y][cursorStore.x].strategies.length > 0;
    }
</script>

{#if isStrategyCell($isUsingStrategy, $strategyGrid, $cursor)}
<div class=strategy-description-board>
    {#each $strategyGrid[$cursor.y][$cursor.x].strategies as strategy, index}
        {#if index === $strategyGrid[$cursor.y][$cursor.x].strategies.length - 1}
            <span class=strategy-description-text>{strategy.strategyDescription()}</span>
        {:else}
            <span class=strategy-description-text>{strategy.strategyDescription()} + </span>
        {/if}
    {/each}
</div>
{/if}

<style>
    .strategy-description-board {
        @apply flex flex-wrap justify-evenly self-end;
    }

    .strategy-description-text {
        @apply text-gray-500 text-base;
    }
</style>