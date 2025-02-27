<script>
  import {candidates} from '@sudoku/stores/candidates';
  import {userGrid, strategyGrid} from '@sudoku/stores/grid';
  import {cursor} from '@sudoku/stores/cursor';
  import {hints} from '@sudoku/stores/hints';
  import {notes} from '@sudoku/stores/notes';
  import {settings} from '@sudoku/stores/settings';
  import {gamePaused} from '@sudoku/stores/game';
  import {strategyManager} from '@sudoku/strategy/strategyManager';
  import {branchBackManager} from '@sudoku/branch/branchBackManager'
  import {get} from 'svelte/store';

  $: hintsAvailable = $hints > 0;
  $: branchBackTimes = branchBackManager.getBranchBackTimes();
  $: branchBackAvailable = $branchBackTimes > 0;
  $: timeStep = strategyGrid.getTimeStep();
  $: returnToLastTimeStepAvailable = $timeStep > 1;

  function handleHint() {
    if (hintsAvailable) {
      if ($candidates.hasOwnProperty($cursor.x + ',' + $cursor.y)) {
        candidates.clear($cursor);
      }

      if (get(strategyManager.getIsUsingStrategy()) && get(strategyManager.getIsGenerateSingleCandidate())) {
        branchBackManager.getBranchBackTimes().update(val => val + 1);
      }

      strategyGrid.increaseTimeStep();
      const strategyApplyCell = strategyManager.apply($strategyGrid);
      strategyApplyCell.forEach(pos => strategyGrid.setCurrentCell(pos));
      strategyGrid.updateCellCandidates();

      // Update branch back manager
      if (strategyApplyCell.length > 0) {
        strategyManager.getIsUsingStrategy().set(true);
        if (get(strategyManager.getIsGenerateSingleCandidate())) {
          hints.useHint();
          branchBackManager.addBranchBackTimeStep(get(strategyGrid.getTimeStep()));
        }
      } else {
        strategyManager.getIsUsingStrategy().set(false);
      }
    }
  }
</script>

<div class="action-buttons space-x-3">

    <button class="btn btn-round btn-badge" disabled={!branchBackAvailable || $gamePaused} title="ReturnBack"
            on:click={() => branchBackManager.branchBackToLastBranchTimeStep()}>
        <svg class="icon-outline" fill="none" height="24" stroke="currentColor" stroke-linecap="round"
             stroke-linejoin="round"
             stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>

        {#if branchBackAvailable}
            <span class="badge badge-primary">{$branchBackTimes}</span>
        {/if}
    </button>

    <button class="btn btn-round" disabled={$gamePaused || !returnToLastTimeStepAvailable} title="Undo"
            on:click={() => branchBackManager.branchBackToLastTimeStep()}>
        <svg class="icon-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"/>
        </svg>
    </button>

    <button class="btn btn-round" disabled={$gamePaused} title="Redo">
        <svg class="icon-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"/>
        </svg>
    </button>

    <button class="btn btn-round btn-badge"
            disabled={!hintsAvailable}
            on:click={handleHint} title="Hints ({$hints})">
        <svg class="icon-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"/>
        </svg>

        {#if $settings.hintsLimited}
            <span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
        {/if}
    </button>

    <button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
        <svg class="icon-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"/>
        </svg>

        <span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
    </button>

</div>


<style>
    .action-buttons {
        @apply flex flex-wrap justify-evenly self-end;
    }

    .btn-badge {
        @apply relative;
    }

    .badge {
        min-height: 20px;
        min-width: 20px;
        @apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
    }

    .badge-primary {
        @apply bg-primary;
    }
</style>