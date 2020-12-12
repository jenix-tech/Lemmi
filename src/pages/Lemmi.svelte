<script>
  import Feature from "../components/Feature.svelte";
  import { features } from "../strings.js";
</script>

<div class="features">
  {#each features as { title, description }, index}
    <Feature image={title.toLowerCase()} {title} {description} {index} />
  {/each}
</div>
