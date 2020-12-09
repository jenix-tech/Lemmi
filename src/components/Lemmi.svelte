<script>
  import Feature from "./Feature.svelte";
  import Actions from "./Actions.svelte";
  import { features } from "../strings.js";
</script>


<div class="features">
  {#each features as { title, description }, index}
    <Feature image={title.toLowerCase()} {title} {description} {index} />
  {/each}
</div>
<Actions />
