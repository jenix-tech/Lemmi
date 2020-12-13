<script>
  import Feature from "../components/Feature.svelte";
  import { app } from "../strings.js";
</script>

<style>
  .lemmi-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-bottom: 40px;
  }
  .lemmi-title h3 {
    max-width: 800px;
    text-align: center;
  }
  .features {
    max-width: 600px;
    margin: 0 auto;
  }
</style>

<div class="lemmi-title">
  <h3>{app.header.toUpperCase()}</h3>
</div>
<section class="features">
  {#each app.features as { title, description, image }, index}
    <Feature {title} {description} {index} {image} />
  {/each}
</section>
