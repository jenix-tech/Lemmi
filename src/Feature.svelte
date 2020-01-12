<script>
  export let image;
  export let title;
  export let description;
  export let index;
</script>

<style>
  .feature {
    display: flex;
  }

  .feature-image {
    height: 700px;
  }

  .text-wrapper {
    width: 100%;
    justify-content: center;
    align-items: center;
    display: flex;
    flex-direction: column;
    padding: 0 30px;
  }

  .feature-title {
    font-weight: 500;
    font-size: 2.5rem;
  }

  .feature-description {
    font-size: 1.5rem;
  }

  .right {
    flex-flow: row-reverse;
  }
</style>

<div class="feature" class:right={index % 2 !== 0}>
  <img class="feature-image" src="images/{image}.png" alt="{title} image" />
  <div class="text-wrapper">
    <p class="feature-title">{title}</p>
    <p class="feature-description">{description}</p>
  </div>
</div>
